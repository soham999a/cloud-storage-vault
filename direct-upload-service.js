/**
 * Direct Upload Service - A simple upload service that directly updates the UI
 */

class DirectUploadService {
    constructor() {
        this.maxFileSizeMB = 5; // 5MB limit for free users
        this.maxFileSizeBytes = this.maxFileSizeMB * 1024 * 1024;
        console.log(`DirectUploadService initialized with ${this.maxFileSizeMB}MB limit`);
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
     * Upload a file
     * @param {string} userId - The user ID
     * @param {File} file - The file to upload
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Promise<Object>} - A promise that resolves with the upload result
     */
    uploadFile(userId, file, progressCallback = () => {}) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`DirectUploadService: Uploading file ${file.name} (${file.size} bytes) for user ${userId}`);
                
                // Check file size
                if (!this.isWithinSizeLimit(file)) {
                    progressCallback(0, `File exceeds ${this.maxFileSizeMB}MB limit for free users`);
                    reject(new Error(`File exceeds ${this.maxFileSizeMB}MB limit for free users`));
                    return;
                }
                
                progressCallback(10, 'Preparing file...');
                
                // Create a blob URL for the file
                const fileUrl = URL.createObjectURL(file);
                
                // Generate a unique ID
                const fileId = 'direct_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                progressCallback(30, 'Processing file...');
                
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
                    isLocal: true,
                    category: this.getFileCategory(file.type, file.name)
                };
                
                progressCallback(50, 'Storing file...');
                
                // Add a small delay to show progress
                await new Promise(r => setTimeout(r, 500));
                
                // Add file to direct file manager
                window.directFileManager.addFile(fileData);
                
                progressCallback(80, 'Finalizing...');
                
                // Add a small delay to show progress
                await new Promise(r => setTimeout(r, 300));
                
                progressCallback(100, 'File stored successfully');
                
                // Resolve with the result
                resolve(fileData);
            } catch (error) {
                console.error('Error in direct upload:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Get file category based on file type and name
     * @param {string} fileType - The file's MIME type
     * @param {string} fileName - The file's name
     * @returns {string} - The file category
     */
    getFileCategory(fileType, fileName) {
        if (fileType.startsWith('image/')) {
            return 'images';
        } else if (fileType.startsWith('video/')) {
            return 'videos';
        } else if (fileType.startsWith('audio/')) {
            return 'audio';
        } else if (fileType === 'application/pdf') {
            return 'documents';
        } else if (fileType.includes('word') || fileType.includes('document') ||
                   fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
                   fileName.endsWith('.txt') || fileName.endsWith('.rtf')) {
            return 'documents';
        } else if (fileType.includes('sheet') || fileType.includes('excel') ||
                   fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
                   fileName.endsWith('.csv')) {
            return 'documents';
        } else if (fileType.includes('presentation') || fileType.includes('powerpoint') ||
                   fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
            return 'documents';
        } else if (fileType.includes('compressed') || fileType.includes('zip') || fileType.includes('archive') ||
                   fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
            return 'archives';
        } else {
            return 'other';
        }
    }
}

// Create global instance
window.directUploadService = new DirectUploadService();
console.log('DirectUploadService exported to window.directUploadService');
