// Image compression utility
class ImageCompressor {
  constructor(options = {}) {
    this.options = {
      quality: options.quality || 0.6, // Lower quality for faster uploads
      maxWidth: options.maxWidth || 1280, // Reduced max dimensions for faster processing
      maxHeight: options.maxHeight || 720,
      mimeType: options.mimeType || 'image/jpeg',
      convertTypes: options.convertTypes || ['image/png', 'image/webp', 'image/bmp'],
      aggressiveCompression: options.aggressiveCompression || true, // Enable aggressive compression
      concurrentProcessing: options.concurrentProcessing || 2 // Process multiple images concurrently
    };

    // Create a worker pool for concurrent processing
    this.workerPool = [];
    this.activeWorkers = 0;
  }

  /**
   * Compress an image file with optimized performance
   * @param {File} file - The image file to compress
   * @returns {Promise<File>} - A promise that resolves with the compressed file
   */
  async compress(file) {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      console.log('Not an image, skipping compression:', file.name);
      return file;
    }

    // Skip small images (less than 100KB)
    if (file.size < 100 * 1024) {
      console.log('Image already small, skipping compression:', file.name);
      return file;
    }

    // Use createImageBitmap for faster loading when available
    const useImageBitmap = typeof createImageBitmap === 'function';

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging on large images
      const timeout = setTimeout(() => {
        console.warn(`Compression timeout for ${file.name}, using original file`);
        resolve(file);
      }, 10000); // 10 second timeout

      const processImage = async () => {
        try {
          let imgSource;

          if (useImageBitmap) {
            // Faster method using ImageBitmap
            imgSource = await createImageBitmap(file);
          } else {
            // Fallback to traditional method
            const reader = new FileReader();
            const loadPromise = new Promise((resolveLoad, rejectLoad) => {
              reader.onload = e => resolveLoad(e.target.result);
              reader.onerror = rejectLoad;
            });

            reader.readAsDataURL(file);
            const dataUrl = await loadPromise;

            imgSource = new Image();
            await new Promise((resolveImg, rejectImg) => {
              imgSource.onload = resolveImg;
              imgSource.onerror = rejectImg;
              imgSource.src = dataUrl;
            });
          }

          // Create canvas with optimized dimensions
          const canvas = document.createElement('canvas');
          let width = imgSource.width;
          let height = imgSource.height;

          // Calculate new dimensions - use more aggressive scaling for larger images
          const scaleFactor = this.options.aggressiveCompression && file.size > 1024 * 1024 ? 0.8 : 1.0;

          if (width > this.options.maxWidth * scaleFactor) {
            height = Math.round(height * (this.options.maxWidth * scaleFactor) / width);
            width = Math.round(this.options.maxWidth * scaleFactor);
          }

          if (height > this.options.maxHeight * scaleFactor) {
            width = Math.round(width * (this.options.maxHeight * scaleFactor) / height);
            height = Math.round(this.options.maxHeight * scaleFactor);
          }

          // Make dimensions even numbers for better compression
          width = Math.floor(width / 2) * 2;
          height = Math.floor(height / 2) * 2;

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas with optimized settings
          const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
          ctx.imageSmoothingQuality = 'medium'; // Use medium quality for better performance
          ctx.drawImage(imgSource, 0, 0, width, height);

          // Clean up ImageBitmap if used
          if (useImageBitmap && imgSource instanceof ImageBitmap) {
            imgSource.close();
          }

          // Determine output type - always convert PNGs and WebPs to JPEG for better compression
          let outputType = this.options.mimeType;
          let quality = this.options.quality;

          // Adjust quality based on file size for better compression of large files
          if (file.size > 2 * 1024 * 1024) { // Over 2MB
            quality *= 0.8; // Reduce quality by 20%
          }

          // Convert canvas to blob with optimized settings
          const blob = await new Promise(resolveBlob => {
            canvas.toBlob(resolveBlob, outputType, quality);
          });

          if (!blob) {
            throw new Error('Canvas to Blob conversion failed');
          }

          // Create new file from blob
          const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: new Date().getTime()
          });

          const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100);
          console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

          // If compression didn't reduce size significantly, use original
          if (compressionRatio < 10) {
            console.log(`Compression for ${file.name} not effective, using original`);
            clearTimeout(timeout);
            resolve(file);
            return;
          }

          clearTimeout(timeout);
          resolve(compressedFile);
        } catch (error) {
          console.error(`Error compressing ${file.name}:`, error);
          clearTimeout(timeout);
          resolve(file); // Use original file on error
        }
      };

      // Start processing
      processImage();
    });
  }

  /**
   * Process multiple files, compressing images and leaving other files untouched
   * Uses concurrent processing for better performance
   * @param {FileList|Array} files - The files to process
   * @returns {Promise<Array>} - A promise that resolves with an array of processed files
   */
  async processFiles(files) {
    const processedFiles = new Array(files.length);
    const imageFiles = [];
    const imageIndexes = [];

    // First, separate images from other files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type.startsWith('image/')) {
        // Skip very small images (less than 50KB) - not worth compressing
        if (file.size < 50 * 1024) {
          processedFiles[i] = file;
        } else {
          imageFiles.push(file);
          imageIndexes.push(i);
        }
      } else {
        // Not an image, add as is
        processedFiles[i] = file;
      }
    }

    // Process images concurrently in batches
    const concurrency = this.options.concurrentProcessing;
    const batches = Math.ceil(imageFiles.length / concurrency);

    for (let b = 0; b < batches; b++) {
      const startIdx = b * concurrency;
      const endIdx = Math.min(startIdx + concurrency, imageFiles.length);
      const batchPromises = [];

      for (let i = startIdx; i < endIdx; i++) {
        batchPromises.push(
          this.compress(imageFiles[i])
            .then(compressedFile => {
              processedFiles[imageIndexes[i]] = compressedFile;
            })
            .catch(error => {
              console.error(`Error processing ${imageFiles[i].name}:`, error);
              processedFiles[imageIndexes[i]] = imageFiles[i]; // Use original on error
            })
        );
      }

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    return processedFiles;
  }
}

// Export the compressor
window.ImageCompressor = ImageCompressor;
