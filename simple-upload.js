// Simple Upload Service - Uses XMLHttpRequest for maximum compatibility
// This is the most reliable approach for file uploads

class SimpleUploadService {
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
      
      // Create a simple XMLHttpRequest to check if the bucket exists
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${this.supabaseUrl}/storage/v1/bucket/${this.bucketName}`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.supabaseKey}`);
      
      // Wait for the response
      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            console.log(`Bucket '${this.bucketName}' already exists`);
            resolve();
          } else if (xhr.status === 404) {
            // Bucket doesn't exist, create it
            this.createBucket().then(resolve).catch(reject);
          } else {
            console.warn('Error checking bucket:', xhr.responseText);
            resolve(); // Continue anyway
          }
        };
        
        xhr.onerror = () => {
          console.warn('Network error checking bucket');
          resolve(); // Continue anyway
        };
        
        xhr.send();
      });
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }
  
  /**
   * Create the bucket
   * @returns {Promise<void>}
   */
  async createBucket() {
    return new Promise((resolve, reject) => {
      console.log(`Creating bucket '${this.bucketName}'...`);
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.supabaseUrl}/storage/v1/bucket`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.supabaseKey}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          console.log(`Bucket '${this.bucketName}' created successfully`);
          resolve();
        } else {
          console.warn('Error creating bucket:', xhr.responseText);
          resolve(); // Continue anyway
        }
      };
      
      xhr.onerror = () => {
        console.warn('Network error creating bucket');
        resolve(); // Continue anyway
      };
      
      xhr.send(JSON.stringify({
        name: this.bucketName,
        public: true,
        file_size_limit: 100 * 1024 * 1024 // 100MB
      }));
    });
  }
  
  /**
   * Upload a file using XMLHttpRequest
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  uploadFile(userId, file, progressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      try {
        progressCallback(5, 'Preparing upload...');
        
        // Create a clean filename (remove special characters)
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const timestamp = new Date().getTime();
        const filePath = `${userId}/${timestamp}_${cleanFileName}`;
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Create XMLHttpRequest
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            // Scale to 10-90% range
            const scaledPercent = Math.floor(10 + (percentComplete * 0.8));
            progressCallback(scaledPercent, `Uploading... ${scaledPercent}%`);
          }
        };
        
        // Set up completion handler
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            progressCallback(95, 'Upload complete, generating URL...');
            
            // Generate the public URL
            const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;
            
            progressCallback(100, 'Upload complete!');
            
            // Resolve with the result
            resolve({
              downloadURL: publicUrl,
              path: filePath,
              size: file.size,
              type: file.type,
              name: file.name,
              timestamp,
              provider: 'simple'
            });
          } else {
            console.error('Upload failed:', xhr.responseText);
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        
        // Set up error handler
        xhr.onerror = () => {
          console.error('Network error during upload');
          reject(new Error('Network error during upload'));
        };
        
        // Set up timeout handler
        xhr.ontimeout = () => {
          console.error('Upload timed out');
          reject(new Error('Upload timed out'));
        };
        
        // Set up abort handler
        xhr.onabort = () => {
          console.error('Upload aborted');
          reject(new Error('Upload aborted'));
        };
        
        // Open the request
        xhr.open('POST', `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`, true);
        
        // Set headers
        xhr.setRequestHeader('Authorization', `Bearer ${this.supabaseKey}`);
        xhr.setRequestHeader('x-upsert', 'true');
        
        // Set timeout
        xhr.timeout = 60000; // 60 seconds
        
        // Send the request
        progressCallback(10, 'Starting upload...');
        xhr.send(formData);
      } catch (error) {
        console.error('Error setting up upload:', error);
        
        // Try local storage as fallback
        this.storeFileLocally(userId, file, progressCallback)
          .then(resolve)
          .catch(reject);
      }
    });
  }
  
  /**
   * Store a file locally when upload fails
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
    return new Promise((resolve, reject) => {
      try {
        // Check if it's a local file
        if (filePath.includes('blob:')) {
          // It's a local file, use local storage manager
          this.localStorageManager.deleteFile(filePath)
            .then(resolve)
            .catch(reject);
          return;
        }
        
        // It's a remote file, use XMLHttpRequest
        const xhr = new XMLHttpRequest();
        xhr.open('DELETE', `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${this.supabaseKey}`);
        
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve(true);
          } else {
            console.error('Error deleting file:', xhr.responseText);
            resolve(false);
          }
        };
        
        xhr.onerror = () => {
          console.error('Network error deleting file');
          resolve(false);
        };
        
        xhr.send();
      } catch (error) {
        console.error('Error deleting file:', error);
        resolve(false);
      }
    });
  }
}

// Export the simple upload service
window.simpleUploadService = new SimpleUploadService();
console.log('Simple upload service exported to window.simpleUploadService');
