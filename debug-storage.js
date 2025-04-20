/**
 * Debug Storage - A tool to check what's in localStorage
 */

// Function to check localStorage content
function checkLocalStorage() {
    console.log('Checking localStorage content...');

    // Get all keys in localStorage
    const keys = Object.keys(localStorage);
    console.log('localStorage keys:', keys);

    // Look for our storage key
    const cloudVaultFiles = localStorage.getItem('cloudVaultFiles');
    console.log('cloudVaultFiles content:', cloudVaultFiles);

    // Parse the content if it exists
    if (cloudVaultFiles) {
        try {
            const files = JSON.parse(cloudVaultFiles);
            console.log('Parsed files:', files);
            return files;
        } catch (error) {
            console.error('Error parsing cloudVaultFiles:', error);
        }
    }

    return null;
}

// Function to display files in the UI for debugging
function displayDebugFiles() {
    const files = checkLocalStorage();

    if (!files || files.length === 0) {
        alert('No files found in localStorage');
        return;
    }

    // Create a debug display
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.top = '50%';
    debugDiv.style.left = '50%';
    debugDiv.style.transform = 'translate(-50%, -50%)';
    debugDiv.style.backgroundColor = '#000';
    debugDiv.style.color = '#0f0';
    debugDiv.style.padding = '20px';
    debugDiv.style.borderRadius = '10px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.maxWidth = '80%';
    debugDiv.style.maxHeight = '80%';
    debugDiv.style.overflow = 'auto';
    debugDiv.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';

    // Add a close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.backgroundColor = '#0f0';
    closeBtn.style.color = '#000';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '5px 10px';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginBottom = '10px';
    closeBtn.onclick = () => debugDiv.remove();

    debugDiv.appendChild(closeBtn);

    // Add a heading
    const heading = document.createElement('h3');
    heading.textContent = `Found ${files.length} files in localStorage`;
    heading.style.marginBottom = '10px';
    debugDiv.appendChild(heading);

    // Add file list
    const fileList = document.createElement('ul');
    fileList.style.listStyleType = 'none';
    fileList.style.padding = '0';

    files.forEach(file => {
        const fileItem = document.createElement('li');
        fileItem.style.marginBottom = '10px';
        fileItem.style.padding = '10px';
        fileItem.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        fileItem.style.borderRadius = '5px';

        fileItem.innerHTML = `
            <strong>Name:</strong> ${file.name}<br>
            <strong>ID:</strong> ${file.id}<br>
            <strong>Type:</strong> ${file.type}<br>
            <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB<br>
            <strong>Created:</strong> ${new Date(file.createdAt).toLocaleString()}<br>
            <strong>User ID:</strong> ${file.userId}<br>
        `;

        // Add a view button if it's an image
        if (file.type.startsWith('image/')) {
            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View Image';
            viewBtn.style.backgroundColor = '#0f0';
            viewBtn.style.color = '#000';
            viewBtn.style.border = 'none';
            viewBtn.style.padding = '3px 8px';
            viewBtn.style.borderRadius = '3px';
            viewBtn.style.cursor = 'pointer';
            viewBtn.style.marginTop = '5px';
            viewBtn.onclick = () => window.open(file.url, '_blank');

            fileItem.appendChild(viewBtn);
        }

        fileList.appendChild(fileItem);
    });

    debugDiv.appendChild(fileList);
    document.body.appendChild(debugDiv);
}

// Make the debug functions available globally
window.checkLocalStorage = checkLocalStorage;
window.displayDebugFiles = displayDebugFiles;
