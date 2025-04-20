/**
 * Simple Upload Service - A reliable upload service for free users with 5MB limit
 */

class SimpleUploadService {
    constructor() {
        // Configuration
        this.maxFileSizeMB = 5; // 5MB limit for free users
        this.maxFileSizeBytes = this.maxFileSizeMB * 1024 * 1024;

        // Initialize simple file storage
        this.fileStorage = new SimpleFileStorage();

        console.log(`SimpleUploadService initialized with ${this.maxFileSizeMB}MB limit`);
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

                // Simulate progress
                progressCallback(30, 'Processing file...');

                // Store the file locally
                progressCallback(50, 'Storing file locally...');

                // Add a small delay to show progress
                await new Promise(r => setTimeout(r, 500));

                const result = await this.fileStorage.saveFile(userId, file);

                // More progress
                progressCallback(80, 'Finalizing...');

                // Add a small delay to show progress
                await new Promise(r => setTimeout(r, 300));

                progressCallback(100, 'File stored successfully');

                // Resolve with the result
                resolve(result);
            } catch (error) {
                console.error('Error in simple upload:', error);
                reject(error);
            }
        });
    }

    /**
     * Get all files for a user
     * @param {string} userId - The user ID
     * @returns {Promise<Array>} - A promise that resolves with an array of files
     */
    getFiles(userId) {
        return this.fileStorage.getFiles(userId);
    }

    /**
     * Get a file by ID
     * @param {string} fileId - The ID of the file to get
     * @returns {Promise<Object>} - A promise that resolves with the file data
     */
    getFile(fileId) {
        return this.fileStorage.getFile(fileId);
    }

    /**
     * Delete a file
     * @param {string} fileId - The ID of the file to delete
     * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
     */
    deleteFile(fileId) {
        return this.fileStorage.deleteFile(fileId);
    }
}

// Export the SimpleUploadService
window.simpleUploadService = new SimpleUploadService();
console.log('SimpleUploadService exported to window.simpleUploadService');
