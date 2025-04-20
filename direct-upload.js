// Direct Upload Service - Uses simple fetch API for reliable uploads
// This bypasses the Supabase SDK and Firebase SDK for more reliable uploads

class DirectUploadService {
  constructor() {
    // Supabase configuration
    this.supabaseUrl = 'https://rpznczfcbshqukwiipvy.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwem5jemZjYnNocXVrd2lpcHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMjMzMDEsImV4cCI6MjA2MDY5OTMwMX0.V9VONiVdgihVZUqSORekt_E50l1iJcmj4VFxGY5tFKU';
    this.bucketName = 'cloud-vault-files';

    // Local storage fallback
    this.localStorageManager = new LocalStorageManager();
    this.localStorageManager.init().catch(err => console.error('Failed to initialize local storage:', err));

    // Initialize bucket
    this.initBucket().catch(err => console.error('Failed to initialize bucket:', err));
  }

  /**
   * Initialize the bucket
   * @returns {Promise<void>}
   */
  async initBucket() {
    try {
      console.log('Checking if bucket exists...');

      // Check if bucket exists
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/bucket/${this.bucketName}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 404) {
        // Bucket doesn't exist, create it
        console.log(`Bucket '${this.bucketName}' doesn't exist, creating...`);

        const createResponse = await fetch(
          `${this.supabaseUrl}/storage/v1/bucket`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: this.bucketName,
              public: true,
              file_size_limit: 100 * 1024 * 1024 // 100MB
            })
          }
        );

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.warn('Error creating bucket:', errorData);
        } else {
          console.log(`Bucket '${this.bucketName}' created successfully`);
        }
      } else if (response.ok) {
        console.log(`Bucket '${this.bucketName}' already exists`);
      } else {
        console.warn('Error checking bucket:', await response.json());
      }
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }

  /**
   * Upload a file directly using fetch API
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  async uploadFile(userId, file, progressCallback = () => {}) {
    try {
      progressCallback(5, 'Preparing direct upload...');

      // Create a clean filename (remove special characters)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = new Date().getTime();
      const filePath = `${userId}/${timestamp}_${cleanFileName}`;

      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', file);

      progressCallback(15, 'Starting direct upload...');

      // Set up timeout to prevent hanging uploads
      const uploadPromise = this.performUpload(filePath, formData, progressCallback);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 30000); // 30 second timeout
      });

      // Race the upload against the timeout
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);

      progressCallback(95, 'Upload complete, generating URL...');

      // Generate the public URL
      const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;

      progressCallback(100, 'Upload complete!');

      return {
        downloadURL: publicUrl,
        path: filePath,
        size: file.size,
        type: file.type,
        name: file.name,
        timestamp,
        provider: 'direct'
      };
    } catch (error) {
      console.error('Direct upload error:', error);

      // Try local storage as fallback
      try {
        progressCallback(10, 'Direct upload failed, trying local storage...');
        return await this.storeFileLocally(userId, file, progressCallback);
      } catch (localError) {
        console.error('Local storage fallback failed:', localError);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Perform the actual upload with progress tracking
   * @param {string} filePath - The path to upload to
   * @param {FormData} formData - The form data containing the file
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves when the upload is complete
   */
  async performUpload(filePath, formData, progressCallback) {
    // Simulate progress updates
    let progress = 15;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += 5;
        progressCallback(progress, `Uploading... ${progress}%`);
      }
    }, 300);

    try {
      // Upload the file using fetch API
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'x-upsert': 'true'
          },
          body: formData
        }
      );

      // Clear the progress interval
      clearInterval(progressInterval);

      // Check if the upload was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Clear the progress interval in case of error
      clearInterval(progressInterval);
      throw error;
    }
  }

  /**
   * Store a file locally when direct upload fails
   * @param {string} userId - The user ID
   * @param {File} file - The file to store
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the file metadata
   */
  async storeFileLocally(userId, file, progressCallback) {
    progressCallback(20, 'Preparing local storage...');

    try {
      // Initialize local storage
      await this.localStorageManager.init();

      // Store the file locally
      progressCallback(50, 'Storing file locally...');
      const result = await this.localStorageManager.saveFile(userId, file);

      progressCallback(100, 'File stored locally');

      return {
        ...result,
        isLocal: true,
        provider: 'local'
      };
    } catch (error) {
      console.error('Error storing file locally:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
   */
  async deleteFile(filePath) {
    try {
      // Check if it's a local file
      if (filePath.includes('blob:')) {
        // It's a local file, use local storage manager
        return await this.localStorageManager.deleteFile(filePath);
      }

      // It's a remote file, use fetch API
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

// Export the direct upload service
window.directUploadService = new DirectUploadService();
console.log('Direct upload service exported to window.directUploadService');
