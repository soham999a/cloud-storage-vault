// Fast Upload Service - Optimized for speed with chunked uploads

// Import Firebase storage functions from the global scope
// These will be available from the Firebase SDK loaded in the HTML
const { ref, uploadBytes, getDownloadURL } = window.firebaseStorage || {};

class FastUploadService {
  constructor(options = {}) {
    this.options = {
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB chunks by default
      concurrentUploads: options.concurrentUploads || 3, // Number of concurrent chunk uploads
      maxRetries: options.maxRetries || 3, // Maximum number of retries per chunk
      retryDelay: options.retryDelay || 1000, // Delay between retries in ms
      preferredStorage: options.preferredStorage || 'supabase', // Default to Supabase for better reliability
      ...options
    };

    // Initialize local storage for failed uploads
    this.localStorageManager = new LocalStorageManager();
    this.localStorageManager.init().catch(err => console.error('Failed to initialize local storage:', err));

    // Check storage availability
    this.checkStorageAvailability();

    // Log the preferred storage provider
    console.log(`Fast upload service initialized with preferred storage: ${this.options.preferredStorage}`);
  }

  /**
   * Check storage availability for both Firebase and Supabase
   * @returns {Promise<Object>} - Object with availability status for each storage provider
   */
  async checkStorageAvailability() {
    const availability = {
      firebase: this.checkFirebaseAvailability(),
      supabase: await this.checkSupabaseAvailability(),
      localStorage: true // Local storage is always available as a last resort
    };

    console.log('Storage availability:', availability);
    return availability;
  }

  /**
   * Check if Firebase storage functions are available
   * @returns {boolean} - Whether Firebase storage functions are available
   */
  checkFirebaseAvailability() {
    // Check if Firebase services are available
    if (!window.firebaseServices) {
      console.warn('Firebase services not available');
      return false;
    }

    // Check if Firebase storage is available
    if (!window.firebaseServices.storage) {
      console.warn('Firebase storage not available');
      return false;
    }

    // Make Firebase storage functions available globally if not already
    if (!window.firebaseStorage) {
      // Get Firebase storage functions from the Firebase SDK
      try {
        // Try to extract the functions from the Firebase SDK
        const firebaseModule = window.firebase || {};
        const storageModule = firebaseModule.storage || {};

        window.firebaseStorage = {
          ref: storageModule.ref,
          uploadBytes: storageModule.uploadBytes,
          getDownloadURL: storageModule.getDownloadURL
        };

        console.log('Firebase storage functions extracted successfully');
      } catch (error) {
        console.warn('Failed to extract Firebase storage functions:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if Supabase storage is available
   * @returns {Promise<boolean>} - Whether Supabase storage is available
   */
  async checkSupabaseAvailability() {
    if (!window.supabaseStorage) {
      console.warn('Supabase storage not available');
      return false;
    }

    try {
      // Check if Supabase is ready
      if (typeof window.supabaseStorage.isReady === 'function') {
        return await window.supabaseStorage.isReady();
      }

      return true;
    } catch (error) {
      console.warn('Error checking Supabase availability:', error);
      return false;
    }
  }

  /**
   * Upload a file to Firebase Storage with chunking for better performance
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  async uploadFile(userId, file, progressCallback = () => {}) {
    progressCallback(0, 'Checking available storage options...');

    // Check storage availability
    const availability = await this.checkStorageAvailability();

    // Determine which storage provider to use based on availability and preference
    let storageProvider = this.options.preferredStorage;

    // If preferred storage is not available, try alternatives
    if (!availability[storageProvider]) {
      console.warn(`Preferred storage '${storageProvider}' not available, trying alternatives`);

      if (availability.supabase) {
        storageProvider = 'supabase';
      } else if (availability.firebase) {
        storageProvider = 'firebase';
      } else {
        storageProvider = 'localStorage';
      }

      console.log(`Using '${storageProvider}' as fallback storage provider`);
    }

    progressCallback(5, `Using ${storageProvider} for upload...`);

    // Use the selected storage provider
    try {
      switch (storageProvider) {
        case 'supabase':
          return this.uploadToSupabase(userId, file, progressCallback);

        case 'firebase':
          // Skip chunking for small files (less than 1MB)
          if (file.size <= this.options.chunkSize) {
            return this.uploadSmallFile(userId, file, progressCallback);
          }
          return this.uploadToFirebaseChunked(userId, file, progressCallback);

        case 'localStorage':
        default:
          return this.storeFileLocally(userId, file, progressCallback);
      }
    } catch (error) {
      console.error(`Error with ${storageProvider} upload:`, error);

      // Try fallbacks in order
      if (storageProvider !== 'supabase' && availability.supabase) {
        console.log('Trying Supabase as fallback...');
        try {
          return await this.uploadToSupabase(userId, file, progressCallback);
        } catch (supabaseError) {
          console.error('Supabase fallback failed:', supabaseError);
        }
      }

      if (storageProvider !== 'firebase' && availability.firebase) {
        console.log('Trying Firebase as fallback...');
        try {
          return await this.uploadSmallFile(userId, file, progressCallback);
        } catch (firebaseError) {
          console.error('Firebase fallback failed:', firebaseError);
        }
      }

      // Last resort: local storage
      console.log('Using local storage as last resort...');
      return this.storeFileLocally(userId, file, progressCallback);
    }
  }

  /**
   * Upload a file to Supabase Storage
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  async uploadToSupabase(userId, file, progressCallback) {
    if (!window.supabaseStorage) {
      throw new Error('Supabase storage not available');
    }

    progressCallback(0, `Preparing ${file.name} for Supabase upload...`);

    try {
      // Use Supabase storage service
      return await window.supabaseStorage.uploadFile(userId, file, progressCallback);
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Firebase Storage with chunking
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  async uploadToFirebaseChunked(userId, file, progressCallback) {

    try {
      // Create a clean filename (remove special characters)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = new Date().getTime();
      const path = `users/${userId}/${timestamp}_${cleanFileName}`;

      // Set metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'originalName': file.name,
          'uploadedBy': userId,
          'uploadTime': timestamp.toString()
        }
      };

      // Split file into chunks
      const chunks = this.splitFileIntoChunks(file);
      let uploadedBytes = 0;

      // Create upload session
      const sessionId = `${userId}_${timestamp}_${cleanFileName}`;
      const uploadSession = {
        id: sessionId,
        path: path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        chunks: chunks.length,
        uploadedChunks: 0,
        startTime: timestamp
      };

      // Upload chunks with concurrency control
      const uploadPromises = [];
      const activeUploads = new Set();
      const failedChunks = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkUpload = async () => {
          const chunk = chunks[i];
          const chunkIndex = i;

          // Try to upload chunk with retries
          let retries = 0;
          let success = false;

          while (retries <= this.options.maxRetries && !success) {
            try {
              // Upload chunk
              await this.uploadChunk(path, chunk, chunkIndex, chunks.length, metadata);
              success = true;

              // Update progress
              uploadedBytes += chunk.size;
              uploadSession.uploadedChunks++;

              const progress = Math.round((uploadedBytes / file.size) * 100);
              progressCallback(progress, `Uploading chunk ${chunkIndex + 1}/${chunks.length}`);

            } catch (error) {
              retries++;
              console.warn(`Chunk ${chunkIndex} upload failed (attempt ${retries}/${this.options.maxRetries}):`, error);

              if (retries > this.options.maxRetries) {
                failedChunks.push(chunkIndex);
                console.error(`Failed to upload chunk ${chunkIndex} after ${this.options.maxRetries} retries`);
              } else {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
              }
            }
          }

          // Remove from active uploads
          activeUploads.delete(chunkUpload);

          // Start next chunk if any are waiting
          if (i + this.options.concurrentUploads < chunks.length) {
            const nextChunkIndex = i + this.options.concurrentUploads;
            const nextChunkUpload = chunkUploads[nextChunkIndex];
            activeUploads.add(nextChunkUpload);
            uploadPromises.push(nextChunkUpload());
          }
        };

        // Store all chunk upload functions
        uploadPromises.push(chunkUpload);
      }

      // Start initial concurrent uploads
      const chunkUploads = [...uploadPromises];
      const initialUploads = chunkUploads.slice(0, this.options.concurrentUploads);

      for (const upload of initialUploads) {
        activeUploads.add(upload);
        upload();
      }

      // Wait for all uploads to complete
      await Promise.all(Array.from(activeUploads));

      // If any chunks failed, store the file locally instead
      if (failedChunks.length > 0) {
        console.warn(`${failedChunks.length} chunks failed to upload. Storing file locally.`);
        return this.storeFileLocally(userId, file, progressCallback);
      }

      // Finalize the upload by combining chunks
      progressCallback(100, 'Finalizing upload...');

      // Get download URL
      const downloadURL = await this.getDownloadURL(path);

      return {
        downloadURL,
        path,
        size: file.size,
        type: file.type,
        name: file.name,
        timestamp
      };
    } catch (error) {
      console.error('Error in chunked upload:', error);

      // Fall back to local storage
      return this.storeFileLocally(userId, file, progressCallback);
    }
  }

  /**
   * Upload a small file directly without chunking
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  async uploadSmallFile(userId, file, progressCallback) {
    try {
      progressCallback(0, `Starting upload of ${file.name}...`);

      // Make sure Firebase services are available
      if (!window.firebaseServices || !window.firebaseServices.uploadFile) {
        throw new Error('Firebase upload function not available');
      }

      // Use the existing Firebase upload function with better error handling
      progressCallback(10, `Preparing ${file.name} for upload...`);

      // Add a timeout to prevent hanging
      const uploadPromise = window.firebaseServices.uploadFile(userId, file);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Upload timeout for ${file.name}`)), 60000); // 60 second timeout
      });

      // Update progress periodically while waiting
      let progress = 10;
      const progressInterval = setInterval(() => {
        if (progress < 90) {
          progress += 5;
          progressCallback(progress, `Uploading ${file.name}...`);
        }
      }, 2000);

      // Race the upload against the timeout
      const result = await Promise.race([uploadPromise, timeoutPromise]);

      // Clear the progress interval
      clearInterval(progressInterval);

      progressCallback(100, 'Upload complete!');
      return result;
    } catch (error) {
      console.error(`Error uploading small file ${file.name}:`, error);
      progressCallback(0, `Error uploading to cloud. Trying local storage...`);
      return this.storeFileLocally(userId, file, progressCallback);
    }
  }

  /**
   * Split a file into chunks
   * @param {File} file - The file to split
   * @returns {Array<Blob>} - Array of file chunks
   */
  splitFileIntoChunks(file) {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + this.options.chunkSize, file.size);
      chunks.push(file.slice(start, end));
      start = end;
    }

    return chunks;
  }

  /**
   * Upload a single chunk to Firebase Storage
   * @param {string} path - The storage path
   * @param {Blob} chunk - The chunk to upload
   * @param {number} index - The chunk index
   * @param {number} total - The total number of chunks
   * @param {Object} metadata - The file metadata
   * @returns {Promise<void>} - A promise that resolves when the chunk is uploaded
   */
  async uploadChunk(path, chunk, index, total, metadata) {
    try {
      // Create a reference to the chunk
      const chunkPath = `${path}_chunk_${index}_of_${total}`;

      // Get Firebase storage reference directly from the window.firebaseServices
      const storage = window.firebaseServices.storage;

      // Get the storage functions
      const { ref, uploadBytes } = window.firebaseStorage || window.firebaseServices;

      if (!ref || !uploadBytes) {
        throw new Error('Firebase storage functions not available');
      }

      // Create a reference to the chunk location
      const storageRef = ref(storage, chunkPath);

      // Upload the chunk with metadata
      await uploadBytes(storageRef, chunk, {
        contentType: 'application/octet-stream',
        customMetadata: {
          ...metadata.customMetadata,
          chunkIndex: index.toString(),
          totalChunks: total.toString()
        }
      });

      console.log(`Chunk ${index + 1}/${total} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading chunk ${index}:`, error);
      throw error;
    }
  }

  /**
   * Get the download URL for a file
   * @param {string} path - The storage path
   * @returns {Promise<string>} - A promise that resolves with the download URL
   */
  async getDownloadURL(path) {
    try {
      const storage = window.firebaseServices.storage;

      // Get the storage functions
      const { ref, getDownloadURL } = window.firebaseStorage || window.firebaseServices;

      if (!ref || !getDownloadURL) {
        throw new Error('Firebase storage functions not available');
      }

      const fileRef = ref(storage, path);
      const url = await getDownloadURL(fileRef);

      console.log(`Download URL obtained for ${path}`);
      return url;
    } catch (error) {
      console.error(`Error getting download URL for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Store a file locally when Firebase upload fails
   * @param {string} userId - The user ID
   * @param {File} file - The file to store
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the file metadata
   */
  async storeFileLocally(userId, file, progressCallback) {
    progressCallback(0, 'Preparing local storage...');

    try {
      // Initialize local storage
      await this.localStorageManager.init();

      // Store the file locally
      progressCallback(50, 'Storing file locally...');
      const result = await this.localStorageManager.saveFile(userId, file);

      progressCallback(100, 'File stored locally');

      return {
        ...result,
        isLocal: true
      };
    } catch (error) {
      console.error('Error storing file locally:', error);
      throw error;
    }
  }
}

// Export the service
window.FastUploadService = FastUploadService;
