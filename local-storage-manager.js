/**
 * LocalStorageManager - A class to handle local storage operations for files
 * This is used as a fallback when cloud storage is not available or fails
 */
class LocalStorageManager {
    constructor() {
        this.dbName = 'cloudVaultLocalStorage';
        this.dbVersion = 1;
        this.storeName = 'files';
        this.db = null;
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise} - A promise that resolves when the database is ready
     */
    init() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            // Check if IndexedDB is supported
            if (!window.indexedDB) {
                reject(new Error('Your browser doesn\'t support IndexedDB. Local storage will not be available.'));
                return;
            }

            // Open the database
            const request = window.indexedDB.open(this.dbName, this.dbVersion);

            // Handle database upgrade (first time or version change)
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for files if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            // Handle success
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('LocalStorageManager: IndexedDB initialized successfully');
                resolve(this.db);
            };

            // Handle error
            request.onerror = (event) => {
                console.error('LocalStorageManager: Error initializing IndexedDB', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Save a file to local storage
     * @param {string} userId - The user ID
     * @param {File} file - The file to save
     * @returns {Promise} - A promise that resolves with the saved file data
     */
    saveFile(userId, file) {
        return new Promise((resolve, reject) => {
            // Make sure the database is initialized
            this.init()
                .then(() => {
                    // Read the file as an ArrayBuffer
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const fileData = {
                            userId: userId,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: event.target.result,
                            createdAt: new Date(),
                            lastAccessed: new Date()
                        };

                        // Start a transaction and add the file
                        const transaction = this.db.transaction([this.storeName], 'readwrite');
                        const store = transaction.objectStore(this.storeName);
                        const request = store.add(fileData);

                        request.onsuccess = (event) => {
                            // Get the ID of the newly added file
                            const fileId = event.target.result;
                            
                            // Create a URL for the file
                            const fileUrl = URL.createObjectURL(new Blob([fileData.data], { type: fileData.type }));
                            
                            // Return the file data with ID and URL
                            const result = {
                                id: fileId,
                                userId: fileData.userId,
                                name: fileData.name,
                                type: fileData.type,
                                size: fileData.size,
                                url: fileUrl,
                                createdAt: fileData.createdAt,
                                lastAccessed: fileData.lastAccessed,
                                isLocal: true
                            };
                            
                            console.log('LocalStorageManager: File saved successfully', result);
                            resolve(result);
                        };

                        request.onerror = (event) => {
                            console.error('LocalStorageManager: Error saving file', event.target.error);
                            reject(event.target.error);
                        };
                    };

                    reader.onerror = (event) => {
                        console.error('LocalStorageManager: Error reading file', event.target.error);
                        reject(event.target.error);
                    };

                    // Start reading the file
                    reader.readAsArrayBuffer(file);
                })
                .catch(reject);
        });
    }

    /**
     * Get all files for a user
     * @param {string} userId - The user ID
     * @returns {Promise} - A promise that resolves with an array of file data
     */
    getFiles(userId) {
        return new Promise((resolve, reject) => {
            // Make sure the database is initialized
            this.init()
                .then(() => {
                    const transaction = this.db.transaction([this.storeName], 'readonly');
                    const store = transaction.objectStore(this.storeName);
                    const index = store.index('userId');
                    const request = index.getAll(userId);

                    request.onsuccess = (event) => {
                        const files = event.target.result;
                        
                        // Create URLs for each file
                        const filesWithUrls = files.map(file => {
                            // Create a URL for the file data
                            const fileUrl = URL.createObjectURL(new Blob([file.data], { type: file.type }));
                            
                            // Return file data without the binary data (to save memory)
                            return {
                                id: file.id,
                                userId: file.userId,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                url: fileUrl,
                                createdAt: file.createdAt,
                                lastAccessed: file.lastAccessed,
                                isLocal: true
                            };
                        });
                        
                        console.log(`LocalStorageManager: Retrieved ${filesWithUrls.length} files for user ${userId}`);
                        resolve(filesWithUrls);
                    };

                    request.onerror = (event) => {
                        console.error('LocalStorageManager: Error getting files', event.target.error);
                        reject(event.target.error);
                    };
                })
                .catch(reject);
        });
    }

    /**
     * Get a file by ID
     * @param {number} fileId - The file ID
     * @returns {Promise} - A promise that resolves with the file data
     */
    getFile(fileId) {
        return new Promise((resolve, reject) => {
            // Make sure the database is initialized
            this.init()
                .then(() => {
                    const transaction = this.db.transaction([this.storeName], 'readonly');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.get(fileId);

                    request.onsuccess = (event) => {
                        const file = event.target.result;
                        
                        if (!file) {
                            reject(new Error(`File with ID ${fileId} not found`));
                            return;
                        }
                        
                        // Create a URL for the file
                        const fileUrl = URL.createObjectURL(new Blob([file.data], { type: file.type }));
                        
                        // Update last accessed timestamp
                        file.lastAccessed = new Date();
                        const updateRequest = store.put(file);
                        
                        updateRequest.onsuccess = () => {
                            // Return file data without the binary data
                            const result = {
                                id: file.id,
                                userId: file.userId,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                url: fileUrl,
                                createdAt: file.createdAt,
                                lastAccessed: file.lastAccessed,
                                isLocal: true
                            };
                            
                            console.log('LocalStorageManager: File retrieved successfully', result);
                            resolve(result);
                        };
                        
                        updateRequest.onerror = (event) => {
                            console.error('LocalStorageManager: Error updating last accessed timestamp', event.target.error);
                            // Still return the file even if updating the timestamp fails
                            resolve({
                                id: file.id,
                                userId: file.userId,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                url: fileUrl,
                                createdAt: file.createdAt,
                                lastAccessed: file.lastAccessed,
                                isLocal: true
                            });
                        };
                    };

                    request.onerror = (event) => {
                        console.error('LocalStorageManager: Error getting file', event.target.error);
                        reject(event.target.error);
                    };
                })
                .catch(reject);
        });
    }

    /**
     * Delete a file
     * @param {number} fileId - The file ID
     * @returns {Promise} - A promise that resolves when the file is deleted
     */
    deleteFile(fileId) {
        return new Promise((resolve, reject) => {
            // Make sure the database is initialized
            this.init()
                .then(() => {
                    const transaction = this.db.transaction([this.storeName], 'readwrite');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.delete(fileId);

                    request.onsuccess = () => {
                        console.log(`LocalStorageManager: File ${fileId} deleted successfully`);
                        resolve(true);
                    };

                    request.onerror = (event) => {
                        console.error('LocalStorageManager: Error deleting file', event.target.error);
                        reject(event.target.error);
                    };
                })
                .catch(reject);
        });
    }

    /**
     * Clear all files for a user
     * @param {string} userId - The user ID
     * @returns {Promise} - A promise that resolves when all files are deleted
     */
    clearUserFiles(userId) {
        return new Promise((resolve, reject) => {
            // Get all files for the user first
            this.getFiles(userId)
                .then(files => {
                    // If there are no files, we're done
                    if (files.length === 0) {
                        resolve(true);
                        return;
                    }

                    // Delete each file
                    const deletePromises = files.map(file => this.deleteFile(file.id));
                    
                    // Wait for all deletions to complete
                    Promise.all(deletePromises)
                        .then(() => {
                            console.log(`LocalStorageManager: All files for user ${userId} deleted successfully`);
                            resolve(true);
                        })
                        .catch(error => {
                            console.error('LocalStorageManager: Error deleting files', error);
                            reject(error);
                        });
                })
                .catch(reject);
        });
    }
}

// Export the LocalStorageManager class
window.LocalStorageManager = LocalStorageManager;
console.log('LocalStorageManager loaded and exported to window.LocalStorageManager');
