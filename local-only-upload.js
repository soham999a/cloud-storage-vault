// Local-Only Upload Service - Stores files directly in local storage
// This is a last resort when all other upload methods fail

class LocalOnlyUploadService {
  constructor() {
    // Initialize local storage manager
    this.localStorageManager = new LocalStorageManager();
    this.localStorageManager.init().catch(err => console.error('Failed to initialize local storage:', err));
    
    console.log('Local-only upload service initialized');
  }
  
  /**
   * Upload a file directly to local storage
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  uploadFile(userId, file, progressCallback = () => {}) {
    return new Promise(async (resolve, reject) => {
      try {
        progressCallback(10, 'Preparing local storage...');
        
        // Initialize local storage
        await this.localStorageManager.init();
        
        // Create a clean filename (remove special characters)
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = new Date().getTime();
        
        // Simulate progress
        progressCallback(30, 'Reading file...');
        
        // Read the file as a data URL
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            progressCallback(60, 'Storing file locally...');
            
            // Store the file locally
            const result = await this.localStorageManager.saveFile(userId, file);
            
            progressCallback(100, 'File stored locally');
            
            // Resolve with the result
            resolve({
              ...result,
              isLocal: true,
              provider: 'local-only'
            });
          } catch (error) {
            console.error('Error storing file locally:', error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          reject(error);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error in local-only upload:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Delete a file from local storage
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
   */
  async deleteFile(filePath) {
    try {
      return await this.localStorageManager.deleteFile(filePath);
    } catch (error) {
      console.error('Error deleting file from local storage:', error);
      return false;
    }
  }
}

// Export the local-only upload service
window.localOnlyUploadService = new LocalOnlyUploadService();
console.log('Local-only upload service exported to window.localOnlyUploadService');
