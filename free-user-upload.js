// Free User Upload Service - Optimized for free users with 5MB limit
// This service prioritizes reliability over cloud storage

class FreeUserUploadService {
  constructor() {
    // Configuration
    this.maxFileSizeMB = 5; // 5MB limit for free users
    this.maxFileSizeBytes = this.maxFileSizeMB * 1024 * 1024;
    
    // Initialize local storage manager
    this.localStorageManager = new LocalStorageManager();
    this.localStorageManager.init().catch(err => console.error('Failed to initialize local storage:', err));
    
    console.log(`Free user upload service initialized with ${this.maxFileSizeMB}MB limit`);
  }
  
  /**
   * Check if a file is within the size limit
   * @param {File} file - The file to check
   * @returns {boolean} - True if the file is within the limit
   */
  isWithinSizeLimit(file) {
    return file.size <= this.maxFileSizeBytes;
  }
  
  /**
   * Upload a file for free users
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  uploadFile(userId, file, progressCallback = () => {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // Check file size
        if (!this.isWithinSizeLimit(file)) {
          progressCallback(0, `File exceeds ${this.maxFileSizeMB}MB limit for free users`);
          reject(new Error(`File exceeds ${this.maxFileSizeMB}MB limit for free users`));
          return;
        }
        
        progressCallback(10, 'Preparing file...');
        
        // Create a clean filename (remove special characters)
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = new Date().getTime();
        
        // Simulate progress
        progressCallback(30, 'Processing file...');
        
        // Store the file locally
        progressCallback(50, 'Storing file locally...');
        const result = await this.localStorageManager.saveFile(userId, file);
        
        progressCallback(100, 'File stored successfully');
        
        // Resolve with the result
        resolve({
          ...result,
          isLocal: true,
          provider: 'free-user',
          timestamp
        });
      } catch (error) {
        console.error('Error in free user upload:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Delete a file
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
   */
  async deleteFile(filePath) {
    try {
      return await this.localStorageManager.deleteFile(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

// Export the free user upload service
window.freeUserUploadService = new FreeUserUploadService();
console.log('Free user upload service exported to window.freeUserUploadService');
