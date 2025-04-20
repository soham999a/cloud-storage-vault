// Local storage fallback for when Firebase is unavailable or for large files
class LocalStorageManager {
  constructor() {
    this.dbName = 'cloudVaultLocalStorage';
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize the IndexedDB database
   * @returns {Promise<boolean>} - A promise that resolves to true if initialization was successful
   */
  async init() {
    if (this.initialized) return true;
    
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB is not supported in this browser');
        reject(new Error('IndexedDB not supported'));
        return;
      }
      
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        console.log('LocalStorageManager initialized successfully');
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('userId', 'userId', { unique: false });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'userId' });
        }
      };
    });
  }

  /**
   * Save a file to local storage
   * @param {string} userId - The user ID
   * @param {File} file - The file to save
   * @returns {Promise<Object>} - A promise that resolves with the file metadata
   */
  async saveFile(userId, file) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const fileData = event.target.result;
          const timestamp = new Date().getTime();
          const fileId = `${userId}_${timestamp}_${file.name}`;
          
          const fileObject = {
            id: fileId,
            userId: userId,
            name: file.name,
            type: file.type,
            size: file.size,
            data: fileData,
            createdAt: timestamp,
            lastAccessed: timestamp,
            isLocal: true
          };
          
          const transaction = this.db.transaction(['files', 'metadata'], 'readwrite');
          
          // Save file
          const filesStore = transaction.objectStore('files');
          await filesStore.put(fileObject);
          
          // Update user metadata
          const metadataStore = transaction.objectStore('metadata');
          const userMetadata = await metadataStore.get(userId) || { 
            userId: userId, 
            storageUsed: 0, 
            fileCount: 0 
          };
          
          userMetadata.storageUsed += file.size;
          userMetadata.fileCount += 1;
          
          await metadataStore.put(userMetadata);
          
          // Create URL for the file
          const fileUrl = URL.createObjectURL(new Blob([fileData], { type: file.type }));
          
          resolve({
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl,
            createdAt: new Date(timestamp),
            isLocal: true
          });
        } catch (error) {
          console.error('Error saving file to local storage:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get all files for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - A promise that resolves with an array of file metadata
   */
  async getFiles(userId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const filesStore = transaction.objectStore('files');
      const userIndex = filesStore.index('userId');
      const request = userIndex.getAll(userId);
      
      request.onsuccess = (event) => {
        const files = event.target.result.map(file => {
          // Create URL for the file
          const fileUrl = URL.createObjectURL(new Blob([file.data], { type: file.type }));
          
          return {
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl,
            createdAt: new Date(file.createdAt),
            lastAccessed: new Date(file.lastAccessed),
            isLocal: true
          };
        });
        
        resolve(files);
      };
      
      request.onerror = (event) => {
        console.error('Error getting files:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Delete a file
   * @param {string} fileId - The file ID
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
   */
  async deleteFile(fileId, userId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files', 'metadata'], 'readwrite');
      const filesStore = transaction.objectStore('files');
      
      // Get the file first to get its size
      const getRequest = filesStore.get(fileId);
      
      getRequest.onsuccess = (event) => {
        const file = event.target.result;
        if (!file) {
          reject(new Error('File not found'));
          return;
        }
        
        // Delete the file
        const deleteRequest = filesStore.delete(fileId);
        
        deleteRequest.onsuccess = async () => {
          // Update user metadata
          const metadataStore = transaction.objectStore('metadata');
          const userMetadata = await metadataStore.get(userId);
          
          if (userMetadata) {
            userMetadata.storageUsed -= file.size;
            userMetadata.fileCount -= 1;
            
            await metadataStore.put(userMetadata);
          }
          
          resolve(true);
        };
        
        deleteRequest.onerror = (event) => {
          console.error('Error deleting file:', event.target.error);
          reject(event.target.error);
        };
      };
      
      getRequest.onerror = (event) => {
        console.error('Error getting file:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Get user storage statistics
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - A promise that resolves with the user's storage statistics
   */
  async getUserStats(userId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const metadataStore = transaction.objectStore('metadata');
      const request = metadataStore.get(userId);
      
      request.onsuccess = (event) => {
        const metadata = event.target.result || { 
          userId: userId, 
          storageUsed: 0, 
          fileCount: 0 
        };
        
        resolve(metadata);
      };
      
      request.onerror = (event) => {
        console.error('Error getting user stats:', event.target.error);
        reject(event.target.error);
      };
    });
  }
}

// Export the local storage manager
window.LocalStorageManager = LocalStorageManager;
