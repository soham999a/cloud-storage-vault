/**
 * Direct File Manager - A simple file manager that directly manipulates the UI
 */

class DirectFileManager {
    constructor() {
        this.files = [];
        this.storageKey = 'directVaultFiles';
        this.loadFiles();
        console.log('DirectFileManager initialized with', this.files.length, 'files');
    }

    /**
     * Load files from localStorage
     */
    loadFiles() {
        try {
            const filesJson = localStorage.getItem(this.storageKey);
            this.files = filesJson ? JSON.parse(filesJson) : [];
        } catch (error) {
            console.error('Error loading files from localStorage:', error);
            this.files = [];
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
        }
    }

    /**
     * Add a file
     * @param {Object} fileData - File data object
     */
    addFile(fileData) {
        // Add to files array
        this.files.push(fileData);

        // Save to localStorage
        this.saveFiles();

        // Update UI immediately
        this.updateUI();
    }

    /**
     * Get all files for a user
     * @param {string} userId - User ID
     * @returns {Array} Array of file objects
     */
    getUserFiles(userId) {
        return this.files.filter(file => file.userId === userId);
    }

    /**
     * Delete a file
     * @param {string} fileId - File ID
     */
    deleteFile(fileId) {
        // Find file index
        const fileIndex = this.files.findIndex(file => file.id === fileId);

        if (fileIndex !== -1) {
            // Get the file
            const file = this.files[fileIndex];

            // Revoke blob URL if needed
            if (file.url && file.url.startsWith('blob:')) {
                URL.revokeObjectURL(file.url);
            }

            // Remove from array
            this.files.splice(fileIndex, 1);

            // Save to localStorage
            this.saveFiles();

            // Update UI
            this.updateUI();

            return true;
        }

        return false;
    }

    /**
     * Update the UI to display files
     */
    updateUI() {
        // Get current user
        const user = window.firebaseServices?.auth?.currentUser;
        if (!user) {
            console.warn('Cannot update UI: No user logged in');
            return;
        }

        // Get files for current user
        const userFiles = this.getUserFiles(user.uid);
        console.log('Found', userFiles.length, 'files for user', user.uid);

        // Get files container - try both possible container IDs
        let filesContainer = document.querySelector('.files-list');
        if (!filesContainer) {
            filesContainer = document.getElementById('files-container');
        }

        if (!filesContainer) {
            console.warn('Cannot update UI: Files container not found');
            return;
        }

        console.log('Found files container:', filesContainer);

        // Check if we have files to display
        if (userFiles.length === 0) {
            // No files to display
            filesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📤</div>
                    <p>You haven't uploaded any files yet.</p>
                    <p class="empty-hint">Free users: 5MB maximum file size</p>
                    <button class="upload-first-btn">Upload Your First File (5MB max)</button>
                </div>
            `;

            // Add event listener to upload button
            const uploadBtn = filesContainer.querySelector('.upload-first-btn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', window.handleFileUpload);
            }

            return;
        }

        // We have files to display
        // Get current view mode
        const viewMode = localStorage.getItem('viewMode') || 'grid';

        // Create HTML for files
        let filesHTML = '';

        if (viewMode === 'grid') {
            // Grid view
            filesHTML = '<div class="files-grid">';

            userFiles.forEach(file => {
                const fileIcon = window.getFileIcon(file.type, file.name);
                const fileDate = window.formatDate(new Date(file.createdAt));
                const localBadge = file.isLocal ? '<span class="local-badge">Local</span>' : '';

                filesHTML += `
                    <div class="file-card ${file.isLocal ? 'local-file' : ''}" data-id="${file.id}" data-url="${file.url}" data-type="${file.type}" data-name="${file.name}" data-is-local="${file.isLocal ? 'true' : 'false'}">
                        <div class="file-thumbnail ${fileIcon.class}">${fileIcon.icon}</div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-info">${window.formatFileSize(file.size)} • ${fileDate} ${localBadge}</div>
                    </div>
                `;
            });

            filesHTML += '</div>';
        } else {
            // List view
            userFiles.forEach(file => {
                const fileIcon = window.getFileIcon(file.type, file.name);
                const fileDate = window.formatDate(new Date(file.createdAt));
                const localBadge = file.isLocal ? '<span class="local-badge">Local</span>' : '';

                filesHTML += `
                    <div class="file-item ${file.isLocal ? 'local-file' : ''}" data-id="${file.id}" data-url="${file.url}" data-type="${file.type}" data-name="${file.name}" data-is-local="${file.isLocal ? 'true' : 'false'}">
                        <div class="file-icon ${fileIcon.class}">${fileIcon.icon}</div>
                        <div class="file-details">
                            <div class="file-name">${file.name}</div>
                            <div class="file-meta">${window.formatFileSize(file.size)} • ${fileDate} ${localBadge}</div>
                        </div>
                        <div class="file-actions">
                            <button class="file-action-btn download-btn" title="Download">⬇️</button>
                            <button class="file-action-btn share-btn" title="Share">🔗</button>
                            <button class="file-action-btn delete-btn" title="Delete">🗑️</button>
                        </div>
                    </div>
                `;
            });
        }

        // Update container
        filesContainer.innerHTML = filesHTML;

        // Add event listeners
        if (viewMode === 'grid') {
            // Add event listeners to file cards
            document.querySelectorAll('.file-card').forEach(card => {
                card.addEventListener('click', window.handleFilePreview);
            });
        } else {
            // Add event listeners to file items
            document.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    // Only trigger preview if not clicking on an action button
                    if (!e.target.closest('.file-action-btn')) {
                        window.handleFilePreview.call(this, e);
                    }
                });
            });

            // Add event listeners to file action buttons
            document.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', window.handleFileDownload);
            });

            document.querySelectorAll('.share-btn').forEach(btn => {
                btn.addEventListener('click', window.handleFileShare);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', window.handleFileDelete);
            });
        }
    }
}

// Helper functions
window.getFileIcon = function(fileType, fileName) {
    let icon = '📄';
    let iconClass = 'file-icon-txt';

    if (fileType.startsWith('image/')) {
        icon = '🖼️';
        iconClass = 'file-icon-img';
    } else if (fileType.startsWith('video/')) {
        icon = '🎬';
        iconClass = 'file-icon-vid';
    } else if (fileType.startsWith('audio/')) {
        icon = '🎵';
        iconClass = 'file-icon-aud';
    } else if (fileType === 'application/pdf') {
        icon = '📕';
        iconClass = 'file-icon-pdf';
    } else if (fileType.includes('word') || fileType.includes('document') ||
               fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        icon = '📘';
        iconClass = 'file-icon-doc';
    } else if (fileType.includes('sheet') || fileType.includes('excel') ||
               fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
               fileName.endsWith('.csv')) {
        icon = '📊';
        iconClass = 'file-icon-xls';
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint') ||
               fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
        icon = '📙';
        iconClass = 'file-icon-ppt';
    } else if (fileType.includes('compressed') || fileType.includes('zip') || fileType.includes('archive') ||
               fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
        icon = '📦';
        iconClass = 'file-icon-zip';
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.rtf')) {
        icon = '📝';
        iconClass = 'file-icon-txt';
    }

    return { icon, class: iconClass };
};

window.formatDate = function(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
};

window.formatFileSize = function(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
};

// File handling functions
window.handleFilePreview = function(e) {
    const fileId = this.dataset.id;
    const fileName = this.dataset.name;
    const fileType = this.dataset.type;
    const fileUrl = this.dataset.url;
    const isLocal = this.dataset.isLocal === 'true';

    console.log('Previewing file:', { fileId, fileName, fileType, isLocal });

    // Update preview modal
    document.getElementById('preview-file-name').textContent = fileName;

    // Get preview container
    const previewContainer = document.getElementById('file-preview-container');

    // Clear previous content
    previewContainer.innerHTML = '';

    // Create preview based on file type
    if (fileType.startsWith('image/')) {
        // Image preview
        const img = document.createElement('img');
        img.src = fileUrl;
        img.alt = fileName;
        previewContainer.appendChild(img);
    } else if (fileType.startsWith('video/')) {
        // Video preview
        const video = document.createElement('video');
        video.src = fileUrl;
        video.controls = true;
        video.autoplay = false;
        previewContainer.appendChild(video);
    } else if (fileType.startsWith('audio/')) {
        // Audio preview
        const audio = document.createElement('audio');
        audio.src = fileUrl;
        audio.controls = true;
        previewContainer.appendChild(audio);
    } else if (fileType === 'application/pdf') {
        // PDF preview
        const iframe = document.createElement('iframe');
        iframe.src = fileUrl;
        iframe.className = 'pdf-preview';
        previewContainer.appendChild(iframe);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        // Text preview
        const pre = document.createElement('pre');
        pre.className = 'text-preview';
        pre.textContent = 'Loading text content...';

        // Fetch text content
        fetch(fileUrl)
            .then(response => response.text())
            .then(text => {
                pre.textContent = text;
            })
            .catch(error => {
                pre.textContent = 'Error loading text content: ' + error.message;
            });

        previewContainer.appendChild(pre);
    } else {
        // Generic preview
        const fileIcon = window.getFileIcon(fileType, fileName);
        const genericPreview = document.createElement('div');
        genericPreview.style.textAlign = 'center';
        genericPreview.innerHTML = `
            <div style="font-size: 100px; margin-bottom: 20px;">${fileIcon.icon}</div>
            <p>This file type cannot be previewed directly.</p>
            <p>File type: ${fileType}</p>
        `;
        previewContainer.appendChild(genericPreview);
    }

    // Show preview modal
    document.getElementById('file-preview-modal').classList.add('active');

    // Setup download button
    document.getElementById('download-file-btn').onclick = function() {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Setup delete button
    document.getElementById('delete-file-btn').onclick = function() {
        if (confirm(`Are you sure you want to delete ${fileName}?`)) {
            window.directFileManager.deleteFile(fileId);
            document.getElementById('file-preview-modal').classList.remove('active');
        }
    };
};

// File upload handler
window.handleFileUpload = function() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '*/*'; // Accept all file types

    // Trigger click on the file input
    fileInput.click();

    // Handle file selection
    fileInput.addEventListener('change', function() {
        const files = this.files;

        if (!files || files.length === 0) {
            return;
        }

        // Get current user
        const user = window.firebaseServices?.auth?.currentUser;
        if (!user) {
            alert('You must be logged in to upload files');
            return;
        }

        // Show upload modal
        const uploadModal = document.getElementById('upload-modal');
        uploadModal.classList.add('active');

        // Update upload count
        document.getElementById('upload-count').textContent = `0/${files.length}`;

        // Process files
        processFiles(user.uid, files);
    });

    // Function to process files
    function processFiles(userId, files) {
        const validFiles = [];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        // Validate files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file.size > MAX_SIZE) {
                alert(`File ${file.name} exceeds the 5MB size limit for free users and will be skipped.`);
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) {
            alert('No valid files to upload. Please select files under 5MB.');
            document.getElementById('upload-modal').classList.remove('active');
            return;
        }

        // Upload files one by one
        let currentIndex = 0;
        let uploadedCount = 0;
        let failedCount = 0;

        // Get progress elements
        const progressBar = document.getElementById('upload-progress-bar');
        const progressText = document.getElementById('upload-progress-text');
        const statusText = document.getElementById('upload-status');
        const currentFileName = document.getElementById('current-file-name');
        const uploadCount = document.getElementById('upload-count');

        // Process next file
        function processNextFile() {
            if (currentIndex >= validFiles.length) {
                // All files processed
                const message = `Upload complete: ${uploadedCount} files uploaded, ${failedCount} failed`;
                statusText.textContent = message;

                // Close modal after a delay
                setTimeout(() => {
                    document.getElementById('upload-modal').classList.remove('active');

                    // Update UI
                    window.directFileManager.updateUI();

                    // Show notification
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('success', message, 3000);
                    } else {
                        alert(message);
                    }
                }, 1500);

                return;
            }

            const file = validFiles[currentIndex];
            currentFileName.textContent = file.name;
            uploadCount.textContent = `${currentIndex + 1}/${validFiles.length}`;

            // Reset progress
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
            statusText.textContent = `Uploading ${file.name}...`;

            // Define progress callback
            const updateProgress = (progress, message) => {
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                if (message) {
                    statusText.textContent = message;
                }
            };

            // Upload file
            window.directUploadService.uploadFile(userId, file, updateProgress)
                .then(result => {
                    uploadedCount++;
                    currentIndex++;
                    processNextFile();
                })
                .catch(error => {
                    console.error(`Error uploading ${file.name}:`, error);
                    failedCount++;
                    currentIndex++;
                    processNextFile();
                });
        }

        // Start processing
        processNextFile();
    }
};

// Create global instance
window.directFileManager = new DirectFileManager();
console.log('DirectFileManager exported to window.directFileManager');
