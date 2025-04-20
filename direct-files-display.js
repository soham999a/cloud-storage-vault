/**
 * Direct Files Display - A simple script to directly display files in the UI
 */

// Create a test file and display it immediately
function createAndDisplayTestFile() {
    // Check if user is logged in
    const user = window.firebaseServices?.auth?.currentUser;
    if (!user) {
        console.error('No user logged in');
        return;
    }

    console.log('Creating and displaying test file for user:', user.uid);

    // Create a test file object
    const testFile = {
        id: 'test_file_' + Date.now(),
        name: 'test-document.txt',
        type: 'text/plain',
        size: 1024, // 1KB
        url: '#',
        createdAt: new Date().toISOString(),
        userId: user.uid,
        isLocal: true
    };

    // Get the files list container
    const filesListContainer = document.querySelector('.files-list');
    if (!filesListContainer) {
        console.error('Files list container not found');
        return;
    }

    // Clear the container
    filesListContainer.innerHTML = '';

    // Create a grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'files-grid';

    // Create a file card
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card local-file';
    fileCard.dataset.id = testFile.id;
    fileCard.dataset.name = testFile.name;
    fileCard.dataset.type = testFile.type;
    fileCard.dataset.url = testFile.url;
    fileCard.dataset.isLocal = 'true';

    // Add file icon
    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-thumbnail file-icon-txt';
    fileIcon.textContent = '📄';

    // Add file name
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = testFile.name;

    // Add file info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    fileInfo.textContent = '1.0 KB • ' + new Date().toLocaleDateString() + ' ';

    // Add local badge
    const localBadge = document.createElement('span');
    localBadge.className = 'local-badge';
    localBadge.textContent = 'Local';
    fileInfo.appendChild(localBadge);

    // Assemble the card
    fileCard.appendChild(fileIcon);
    fileCard.appendChild(fileName);
    fileCard.appendChild(fileInfo);

    // Add the card to the grid
    gridContainer.appendChild(fileCard);

    // Add the grid to the container
    filesListContainer.appendChild(gridContainer);

    console.log('Test file displayed successfully');

    // Add click event to the file card
    fileCard.addEventListener('click', function() {
        alert('File clicked: ' + testFile.name);
    });
}

// Flag to track if upload is in progress
let uploadInProgress = false;

// Create a real file from user upload and display it
function createRealFileFromUpload() {
    // Prevent multiple uploads at the same time
    if (uploadInProgress) {
        console.log('Upload already in progress, ignoring request');
        return;
    }

    // Set flag to prevent multiple uploads
    uploadInProgress = true;

    // Create a file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Trigger click on the file input
    fileInput.click();

    // Handle file selection
    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];

            // Check if user is logged in
            const user = window.firebaseServices?.auth?.currentUser;
            if (!user) {
                console.error('No user logged in');
                document.body.removeChild(fileInput);
                return;
            }

            console.log('Creating real file from upload:', file.name);

            // Create a blob URL for the file
            const fileUrl = URL.createObjectURL(file);

            // Create a file object
            const fileObj = {
                id: 'real_file_' + Date.now(),
                name: file.name,
                type: file.type,
                size: file.size,
                url: fileUrl,
                createdAt: new Date().toISOString(),
                userId: user.uid,
                isLocal: true
            };

            // Get the files list container
            const filesListContainer = document.querySelector('.files-list');
            if (!filesListContainer) {
                console.error('Files list container not found');
                document.body.removeChild(fileInput);
                return;
            }

            // Clear the container
            filesListContainer.innerHTML = '';

            // Create a grid container
            const gridContainer = document.createElement('div');
            gridContainer.className = 'files-grid';

            // Create a file card
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card local-file';
            fileCard.dataset.id = fileObj.id;
            fileCard.dataset.name = fileObj.name;
            fileCard.dataset.type = fileObj.type;
            fileCard.dataset.url = fileObj.url;
            fileCard.dataset.isLocal = 'true';

            // Determine file icon
            let iconClass = 'file-icon-txt';
            let iconText = '📄';

            if (file.type.startsWith('image/')) {
                iconClass = 'file-icon-img';
                iconText = '🖼️';
            } else if (file.type.startsWith('video/')) {
                iconClass = 'file-icon-vid';
                iconText = '🎬';
            } else if (file.type.startsWith('audio/')) {
                iconClass = 'file-icon-aud';
                iconText = '🎵';
            } else if (file.type === 'application/pdf') {
                iconClass = 'file-icon-pdf';
                iconText = '📕';
            }

            // Add file icon
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-thumbnail ' + iconClass;
            fileIcon.textContent = iconText;

            // Add file name
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = fileObj.name;

            // Add file info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';

            // Format file size
            let sizeText = '';
            if (file.size < 1024) {
                sizeText = file.size + ' B';
            } else if (file.size < 1024 * 1024) {
                sizeText = (file.size / 1024).toFixed(1) + ' KB';
            } else {
                sizeText = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
            }

            fileInfo.textContent = sizeText + ' • ' + new Date().toLocaleDateString() + ' ';

            // Add local badge
            const localBadge = document.createElement('span');
            localBadge.className = 'local-badge';
            localBadge.textContent = 'Local';
            fileInfo.appendChild(localBadge);

            // Assemble the card
            fileCard.appendChild(fileIcon);
            fileCard.appendChild(fileName);
            fileCard.appendChild(fileInfo);

            // Add the card to the grid
            gridContainer.appendChild(fileCard);

            // Add the grid to the container
            filesListContainer.appendChild(gridContainer);

            console.log('Real file displayed successfully');

            // Add click event to the file card
            fileCard.addEventListener('click', function() {
                // Show file preview
                showFilePreview(fileObj);
            });

            // Save the file to localStorage
            saveFileToLocalStorage(fileObj);
        }

        // Remove the file input
        document.body.removeChild(fileInput);

        // Reset upload flag
        uploadInProgress = false;
    });

    // Also reset the flag if the user cancels the file selection
    setTimeout(() => {
        if (uploadInProgress) {
            console.log('File selection timed out or was cancelled');
            uploadInProgress = false;
        }
    }, 1000);
}

// Show file preview
function showFilePreview(file) {
    // Get preview modal
    const previewModal = document.getElementById('file-preview-modal');
    if (!previewModal) {
        console.error('Preview modal not found');
        return;
    }

    // Update preview modal title
    const previewTitle = document.getElementById('preview-file-name');
    if (previewTitle) {
        previewTitle.textContent = file.name;
    }

    // Get preview container
    const previewContainer = document.getElementById('file-preview-container');
    if (!previewContainer) {
        console.error('Preview container not found');
        return;
    }

    // Clear previous content
    previewContainer.innerHTML = '';

    // Create preview based on file type
    if (file.type.startsWith('image/')) {
        // Image preview
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        img.style.maxWidth = '100%';
        previewContainer.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        // Video preview
        const video = document.createElement('video');
        video.src = file.url;
        video.controls = true;
        video.style.maxWidth = '100%';
        previewContainer.appendChild(video);
    } else if (file.type.startsWith('audio/')) {
        // Audio preview
        const audio = document.createElement('audio');
        audio.src = file.url;
        audio.controls = true;
        audio.style.width = '100%';
        previewContainer.appendChild(audio);
    } else {
        // Generic preview
        const genericPreview = document.createElement('div');
        genericPreview.style.textAlign = 'center';
        genericPreview.style.padding = '50px';

        let iconText = '📄';
        if (file.type === 'application/pdf') {
            iconText = '📕';
        }

        genericPreview.innerHTML = `
            <div style="font-size: 100px; margin-bottom: 20px;">${iconText}</div>
            <p>This file type cannot be previewed directly.</p>
            <p>File type: ${file.type}</p>
        `;
        previewContainer.appendChild(genericPreview);
    }

    // Setup download button
    const downloadBtn = document.getElementById('download-file-btn');
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            const a = document.createElement('a');
            a.href = file.url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    }

    // Setup delete button
    const deleteBtn = document.getElementById('delete-file-btn');
    if (deleteBtn) {
        deleteBtn.onclick = function() {
            if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                // Remove file from localStorage
                removeFileFromLocalStorage(file.id);

                // Close preview modal
                previewModal.classList.remove('active');

                // Refresh file list
                displayFilesFromLocalStorage();
            }
        };
    }

    // Show preview modal
    previewModal.classList.add('active');
}

// Save file to localStorage
function saveFileToLocalStorage(file) {
    try {
        // Get existing files
        let files = [];
        const filesJson = localStorage.getItem('directFiles');
        if (filesJson) {
            files = JSON.parse(filesJson);
        }

        // Add new file
        files.push(file);

        // Save to localStorage
        localStorage.setItem('directFiles', JSON.stringify(files));

        console.log('File saved to localStorage:', file.name);

        // Update dashboard stats if user is logged in
        const user = window.firebaseServices?.auth?.currentUser;
        if (user) {
            // Filter files for current user
            const userFiles = files.filter(f => f.userId === user.uid);
            updateDashboardStats(userFiles);
        }
    } catch (error) {
        console.error('Error saving file to localStorage:', error);
    }
}

// Remove file from localStorage
function removeFileFromLocalStorage(fileId) {
    try {
        // Get existing files
        let files = [];
        const filesJson = localStorage.getItem('directFiles');
        if (filesJson) {
            files = JSON.parse(filesJson);
        }

        // Find file index
        const fileIndex = files.findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
            // Remove file
            files.splice(fileIndex, 1);

            // Save to localStorage
            localStorage.setItem('directFiles', JSON.stringify(files));

            console.log('File removed from localStorage:', fileId);

            // Update dashboard stats if user is logged in
            const user = window.firebaseServices?.auth?.currentUser;
            if (user) {
                // Filter files for current user
                const userFiles = files.filter(f => f.userId === user.uid);
                updateDashboardStats(userFiles);
            }
        }
    } catch (error) {
        console.error('Error removing file from localStorage:', error);
    }
}

// Update dashboard stats with file count and storage usage
function updateDashboardStats(files) {
    try {
        // Calculate total storage used
        let totalBytes = 0;
        files.forEach(file => {
            totalBytes += file.size || 0;
        });

        // Format storage size
        let storageText = '0 GB';
        if (totalBytes > 0) {
            if (totalBytes < 1024 * 1024) {
                storageText = (totalBytes / 1024).toFixed(2) + ' KB';
            } else if (totalBytes < 1024 * 1024 * 1024) {
                storageText = (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
            } else {
                storageText = (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
            }
        }

        // Update storage display - use the correct selector for the stat-value class
        const storageDisplay = document.querySelector('.dashboard-container .stat-card:nth-child(1) .stat-value');
        if (storageDisplay) {
            storageDisplay.textContent = storageText;
            console.log('Updated storage display to:', storageText);
        } else {
            console.warn('Storage display element not found');
        }

        // Update file count - use the correct selector for the stat-value class
        const fileCountDisplay = document.querySelector('.dashboard-container .stat-card:nth-child(2) .stat-value');
        if (fileCountDisplay) {
            fileCountDisplay.textContent = files.length.toString();
            console.log('Updated file count display to:', files.length);
        } else {
            console.warn('File count display element not found');
        }

        console.log(`Updated dashboard stats: ${files.length} files, ${storageText} used`);
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Display files from localStorage
function displayFilesFromLocalStorage() {
    // Check if user is logged in
    const user = window.firebaseServices?.auth?.currentUser;
    if (!user) {
        console.error('No user logged in');
        return;
    }

    try {
        // Get files from localStorage
        let files = [];
        const filesJson = localStorage.getItem('directFiles');
        if (filesJson) {
            files = JSON.parse(filesJson);
        }

        // Filter files for current user
        files = files.filter(file => file.userId === user.uid);

        console.log('Found', files.length, 'files for user', user.uid);

        // Update dashboard stats
        updateDashboardStats(files);

        // Get the files list container
        const filesListContainer = document.querySelector('.files-list');
        if (!filesListContainer) {
            console.error('Files list container not found');
            return;
        }

        // Check if we have files to display
        if (files.length === 0) {
            // No files to display
            filesListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📤</div>
                    <p>You haven't uploaded any files yet.</p>
                    <p class="empty-hint">Free users: 5MB maximum file size</p>
                    <button class="btn" id="upload-btn-empty">Upload Your First File (5MB max)</button>
                </div>
            `;

            // Add event listener to upload button
            const uploadBtn = filesListContainer.querySelector('#upload-btn-empty');
            if (uploadBtn) {
                // Remove any existing listeners by cloning the button
                const newUploadBtn = uploadBtn.cloneNode(true);
                uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
                newUploadBtn.addEventListener('click', createRealFileFromUpload);
            }

            return;
        }

        // Determine current view mode (grid or list)
        const activeViewBtn = document.querySelector('.view-btn.active');
        const viewMode = activeViewBtn ? activeViewBtn.dataset.view : 'grid';

        console.log('Current view mode:', viewMode);

        // Clear the container
        filesListContainer.innerHTML = '';

        if (viewMode === 'grid') {
            // GRID VIEW
            const gridContainer = document.createElement('div');
            gridContainer.className = 'files-grid';

            // Add file cards
            files.forEach(file => {
                // Create a file card
                const fileCard = document.createElement('div');
                fileCard.className = 'file-card local-file';
                fileCard.dataset.id = file.id;
                fileCard.dataset.name = file.name;
                fileCard.dataset.type = file.type;
                fileCard.dataset.url = file.url;
                fileCard.dataset.isLocal = 'true';

                // Determine file icon
                let iconClass = 'file-icon-txt';
                let iconText = '📄';

                if (file.type.startsWith('image/')) {
                    iconClass = 'file-icon-img';
                    iconText = '🖼️';
                } else if (file.type.startsWith('video/')) {
                    iconClass = 'file-icon-vid';
                    iconText = '🎬';
                } else if (file.type.startsWith('audio/')) {
                    iconClass = 'file-icon-aud';
                    iconText = '🎵';
                } else if (file.type === 'application/pdf') {
                    iconClass = 'file-icon-pdf';
                    iconText = '📕';
                }

                // Add file icon
                const fileIcon = document.createElement('div');
                fileIcon.className = 'file-thumbnail ' + iconClass;
                fileIcon.textContent = iconText;

                // Add file name
                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = file.name;

                // Add file info
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';

                // Format file size
                let sizeText = '';
                if (file.size < 1024) {
                    sizeText = file.size + ' B';
                } else if (file.size < 1024 * 1024) {
                    sizeText = (file.size / 1024).toFixed(1) + ' KB';
                } else {
                    sizeText = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                }

                fileInfo.textContent = sizeText + ' • ' + new Date(file.createdAt).toLocaleDateString() + ' ';

                // Add local badge
                const localBadge = document.createElement('span');
                localBadge.className = 'local-badge';
                localBadge.textContent = 'Local';
                fileInfo.appendChild(localBadge);

                // Assemble the card
                fileCard.appendChild(fileIcon);
                fileCard.appendChild(fileName);
                fileCard.appendChild(fileInfo);

                // Add the card to the grid
                gridContainer.appendChild(fileCard);

                // Add click event to the file card
                fileCard.addEventListener('click', function() {
                    // Show file preview
                    showFilePreview(file);
                });
            });

            // Add the grid to the container
            filesListContainer.appendChild(gridContainer);
        } else {
            // LIST VIEW
            files.forEach(file => {
                // Create a file item for list view
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item local-file';
                fileItem.dataset.id = file.id;
                fileItem.dataset.name = file.name;
                fileItem.dataset.type = file.type;
                fileItem.dataset.url = file.url;
                fileItem.dataset.isLocal = 'true';

                // Determine file icon
                let iconClass = 'file-icon-txt';
                let iconText = '📄';

                if (file.type.startsWith('image/')) {
                    iconClass = 'file-icon-img';
                    iconText = '🖼️';
                } else if (file.type.startsWith('video/')) {
                    iconClass = 'file-icon-vid';
                    iconText = '🎬';
                } else if (file.type.startsWith('audio/')) {
                    iconClass = 'file-icon-aud';
                    iconText = '🎵';
                } else if (file.type === 'application/pdf') {
                    iconClass = 'file-icon-pdf';
                    iconText = '📕';
                }

                // Format file size
                let sizeText = '';
                if (file.size < 1024) {
                    sizeText = file.size + ' B';
                } else if (file.size < 1024 * 1024) {
                    sizeText = (file.size / 1024).toFixed(1) + ' KB';
                } else {
                    sizeText = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                }

                // Create file item HTML
                fileItem.innerHTML = `
                    <div class="file-icon ${iconClass}">${iconText}</div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${sizeText} • ${new Date(file.createdAt).toLocaleDateString()} <span class="local-badge">Local</span></div>
                    </div>
                    <div class="file-actions">
                        <button class="file-action-btn download-btn" title="Download">⬇️</button>
                        <button class="file-action-btn share-btn" title="Share">🔗</button>
                        <button class="file-action-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                `;

                // Add the item to the container
                filesListContainer.appendChild(fileItem);

                // Add click event to the file item (excluding action buttons)
                fileItem.addEventListener('click', function(e) {
                    // Only trigger preview if not clicking on an action button
                    if (!e.target.closest('.file-action-btn')) {
                        showFilePreview(file);
                    }
                });

                // Add specific action button handlers
                const downloadBtn = fileItem.querySelector('.download-btn');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent item click
                        const a = document.createElement('a');
                        a.href = file.url;
                        a.download = file.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    });
                }

                const deleteBtn = fileItem.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent item click
                        if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                            removeFileFromLocalStorage(file.id);
                            displayFilesFromLocalStorage(); // Refresh the list
                        }
                    });
                }

                const shareBtn = fileItem.querySelector('.share-btn');
                if (shareBtn) {
                    shareBtn.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent item click
                        alert(`Sharing functionality for ${file.name} will be available in the premium version.`);
                    });
                }
            });
        }

        // Set up view mode toggle buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            // Remove existing listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            // Add new listener
            newBtn.addEventListener('click', function() {
                // Update active state
                viewButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Save view preference
                localStorage.setItem('viewMode', this.dataset.view);

                // Refresh display
                displayFilesFromLocalStorage();
            });
        });

        console.log('Files displayed successfully in', viewMode, 'view');
    } catch (error) {
        console.error('Error displaying files from localStorage:', error);
    }
}

// Track if we've already set up the event listeners to prevent duplicates
let eventListenersInitialized = false;

// Initialize
window.addEventListener('load', function() {
    console.log('Direct Files Display initialized');

    // Wait for Firebase to initialize
    const checkFirebase = setInterval(function() {
        if (window.firebaseServices?.auth?.currentUser) {
            clearInterval(checkFirebase);
            console.log('Firebase initialized, displaying files');

            // Display files from localStorage
            displayFilesFromLocalStorage();

            // Only set up event listeners once
            if (!eventListenersInitialized) {
                console.log('Setting up upload button event listeners');

                // Override the upload button click handler
                const uploadBtn = document.getElementById('upload-btn');
                if (uploadBtn) {
                    // Remove any existing listeners first
                    const newUploadBtn = uploadBtn.cloneNode(true);
                    uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
                    newUploadBtn.addEventListener('click', createRealFileFromUpload);
                }

                // Set the flag to prevent duplicate listeners
                eventListenersInitialized = true;
            }
        }
    }, 1000);
});

// Export functions
window.directFilesDisplay = {
    createAndDisplayTestFile,
    createRealFileFromUpload,
    displayFilesFromLocalStorage
};
