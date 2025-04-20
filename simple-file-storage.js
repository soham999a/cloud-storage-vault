/**
 * Simple File Storage - A lightweight alternative to IndexedDB for storing files
 * This uses a combination of localStorage for metadata and Blob URLs for file data
 */

class SimpleFileStorage {
    constructor() {
        this.storageKey = 'cloudVaultFiles';
        this.files = this.loadFiles();
        console.log('SimpleFileStorage initialized with', this.files.length, 'files');
    }

    /**
     * Load files from localStorage
     * @returns {Array} Array of file metadata
     */
    loadFiles() {
        try {
            const filesJson = localStorage.getItem(this.storageKey);
            return filesJson ? JSON.parse(filesJson) : [];
        } catch (error) {
            console.error('Error loading files from localStorage:', error);
            return [];
        }
    }

    /**
     * Save files to localStorage
     */
    saveFiles() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.files));
        } catch (error) {
            console.error('Error saving files to localStorage:', error);
            // If we hit storage limits, try to remove old files
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldFiles();
            }
        }
    }

    /**
     * Clean up old files if we hit storage limits
     */
    cleanupOldFiles() {
        if (this.files.length > 10) {
            // Sort by date and remove oldest files
            this.files.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            // Remove the oldest 20% of files
            const removeCount = Math.ceil(this.files.length * 0.2);
            this.files.splice(0, removeCount);
            this.saveFiles();
        }
    }

    /**
     * Save a file
     * @param {string} userId - User ID
     * @param {File} file - File object to save
     * @returns {Promise} Promise that resolves with file metadata
     */
    saveFile(userId, file) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Saving file ${file.name} (${file.size} bytes) for user ${userId}`);

                // Create a blob URL for the file
                const fileUrl = URL.createObjectURL(file);

                // Generate a unique ID
                const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                // Create file metadata
                const fileData = {
                    id: fileId,
                    userId: userId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: fileUrl,
                    createdAt: new Date().toISOString(),
                    lastAccessed: new Date().toISOString(),
                    isLocal: true
                };

                // Add to files array
                this.files.push(fileData);

                // Save to localStorage
                this.saveFiles();

                // Verify the file was saved
                const savedFiles = this.loadFiles();
                const savedFile = savedFiles.find(f => f.id === fileId);

                if (savedFile) {
                    console.log('File saved successfully:', savedFile);
                    resolve(fileData);
                } else {
                    console.error('File was not saved properly to localStorage');
                    // Try one more time with a different approach
                    try {
                        // Try to save directly to localStorage
                        localStorage.setItem(`file_${fileId}`, JSON.stringify(fileData));
                        console.log('Saved file directly to localStorage');
                        resolve(fileData);
                    } catch (directError) {
                        console.error('Error saving directly to localStorage:', directError);
                        reject(new Error('Failed to save file to storage'));
                    }
                }
            } catch (error) {
                console.error('Error saving file:', error);
                reject(error);
            }
        });
    }

    /**
     * Get all files for a user
     * @param {string} userId - User ID
     * @returns {Promise} Promise that resolves with array of file metadata
     */
    getFiles(userId) {
        return new Promise((resolve) => {
            // First, check our main files array
            const userFiles = this.files.filter(file => file.userId === userId);
            console.log(`Retrieved ${userFiles.length} files for user ${userId} from main array`);

            // Then, check for any files saved directly to localStorage
            const directFiles = [];
            try {
                // Get all keys in localStorage
                const keys = Object.keys(localStorage);

                // Find keys that start with 'file_'
                const fileKeys = keys.filter(key => key.startsWith('file_'));
                console.log(`Found ${fileKeys.length} potential file keys in localStorage`);

                // Parse each file and check if it belongs to this user
                fileKeys.forEach(key => {
                    try {
                        const fileData = JSON.parse(localStorage.getItem(key));
                        if (fileData && fileData.userId === userId) {
                            // Check if this file is already in our main array
                            const isDuplicate = userFiles.some(file => file.id === fileData.id);
                            if (!isDuplicate) {
                                directFiles.push(fileData);
                            }
                        }
                    } catch (parseError) {
                        console.error(`Error parsing file data for key ${key}:`, parseError);
                    }
                });

                console.log(`Retrieved ${directFiles.length} additional files from direct localStorage`);
            } catch (error) {
                console.error('Error checking direct localStorage files:', error);
            }

            // Combine both sets of files
            const allUserFiles = [...userFiles, ...directFiles];
            console.log(`Total files for user ${userId}: ${allUserFiles.length}`);

            // If we found files directly in localStorage but not in our main array,
            // update our main array for future use
            if (directFiles.length > 0) {
                this.files = [...this.files, ...directFiles];
                this.saveFiles();
            }

            resolve(allUserFiles);
        });
    }

    /**
     * Get a file by ID
     * @param {string} fileId - File ID
     * @returns {Promise} Promise that resolves with file metadata
     */
    getFile(fileId) {
        return new Promise((resolve, reject) => {
            console.log('Looking for file with ID:', fileId);

            // First, check our main files array
            let file = this.files.find(file => file.id === fileId);

            // If not found in main array, check if it was saved directly to localStorage
            if (!file) {
                console.log(`File ${fileId} not found in main array, checking direct localStorage`);
                try {
                    // Try to get the file directly from localStorage
                    const directFileData = localStorage.getItem(`file_${fileId}`);
                    if (directFileData) {
                        file = JSON.parse(directFileData);
                        console.log('Found file in direct localStorage:', file);

                        // Add to our main array for future use
                        this.files.push(file);
                        this.saveFiles();
                    }
                } catch (error) {
                    console.error('Error checking direct localStorage:', error);
                }
            }

            if (!file) {
                console.error(`File with ID ${fileId} not found in any storage`);
                reject(new Error(`File with ID ${fileId} not found`));
                return;
            }

            console.log('Found file:', file);

            // Update last accessed timestamp
            file.lastAccessed = new Date().toISOString();
            this.saveFiles();

            // Also update direct localStorage if it exists there
            try {
                if (localStorage.getItem(`file_${fileId}`)) {
                    localStorage.setItem(`file_${fileId}`, JSON.stringify(file));
                }
            } catch (error) {
                console.error('Error updating direct localStorage:', error);
            }

            resolve(file);
        });
    }

    /**
     * Delete a file
     * @param {string} fileId - File ID
     * @returns {Promise} Promise that resolves when file is deleted
     */
    deleteFile(fileId) {
        return new Promise((resolve, reject) => {
            console.log(`Attempting to delete file with ID: ${fileId}`);

            // First, check our main files array
            const fileIndex = this.files.findIndex(file => file.id === fileId);
            let fileDeleted = false;

            if (fileIndex !== -1) {
                // Get the file to revoke the blob URL
                const file = this.files[fileIndex];

                // Revoke the blob URL to free up memory
                if (file.url && file.url.startsWith('blob:')) {
                    URL.revokeObjectURL(file.url);
                }

                // Remove from array
                this.files.splice(fileIndex, 1);

                // Save to localStorage
                this.saveFiles();

                console.log(`File ${fileId} deleted from main array`);
                fileDeleted = true;
            } else {
                console.log(`File ${fileId} not found in main array`);
            }

            // Also check if it was saved directly to localStorage
            try {
                const directKey = `file_${fileId}`;
                if (localStorage.getItem(directKey)) {
                    // Get the file data first to revoke blob URL if needed
                    try {
                        const fileData = JSON.parse(localStorage.getItem(directKey));
                        if (fileData && fileData.url && fileData.url.startsWith('blob:')) {
                            URL.revokeObjectURL(fileData.url);
                        }
                    } catch (parseError) {
                        console.error('Error parsing file data for revocation:', parseError);
                    }

                    // Remove from localStorage
                    localStorage.removeItem(directKey);
                    console.log(`File ${fileId} deleted from direct localStorage`);
                    fileDeleted = true;
                }
            } catch (error) {
                console.error('Error removing from direct localStorage:', error);
            }

            if (fileDeleted) {
                console.log(`File ${fileId} deleted successfully`);
                resolve(true);
            } else {
                const error = new Error(`File with ID ${fileId} not found in any storage`);
                console.error(error.message);
                reject(error);
            }
        });
    }

    /**
     * Clear all files for a user
     * @param {string} userId - User ID
     * @returns {Promise} Promise that resolves when all files are deleted
     */
    clearUserFiles(userId) {
        return new Promise((resolve) => {
            console.log(`Clearing all files for user ${userId}`);

            // Get all files for the user from main array
            const userFiles = this.files.filter(file => file.userId === userId);

            // Revoke all blob URLs
            userFiles.forEach(file => {
                if (file.url && file.url.startsWith('blob:')) {
                    URL.revokeObjectURL(file.url);
                }
            });

            // Remove all user files from main array
            this.files = this.files.filter(file => file.userId !== userId);

            // Save to localStorage
            this.saveFiles();

            // Also check for any files saved directly to localStorage
            try {
                // Get all keys in localStorage
                const keys = Object.keys(localStorage);

                // Find keys that start with 'file_'
                const fileKeys = keys.filter(key => key.startsWith('file_'));

                // Check each file and remove if it belongs to this user
                let directFilesRemoved = 0;
                fileKeys.forEach(key => {
                    try {
                        const fileData = JSON.parse(localStorage.getItem(key));
                        if (fileData && fileData.userId === userId) {
                            // Revoke blob URL if needed
                            if (fileData.url && fileData.url.startsWith('blob:')) {
                                URL.revokeObjectURL(fileData.url);
                            }

                            // Remove from localStorage
                            localStorage.removeItem(key);
                            directFilesRemoved++;
                        }
                    } catch (parseError) {
                        console.error(`Error parsing file data for key ${key}:`, parseError);
                    }
                });

                console.log(`Removed ${directFilesRemoved} files from direct localStorage for user ${userId}`);
            } catch (error) {
                console.error('Error clearing direct localStorage files:', error);
            }

            console.log(`All files for user ${userId} deleted successfully`);
            resolve(true);
        });
    }
}

// Export the SimpleFileStorage class
window.SimpleFileStorage = SimpleFileStorage;
console.log('SimpleFileStorage loaded and exported to window.SimpleFileStorage');
