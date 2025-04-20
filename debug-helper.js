/**
 * Debug helper functions for Cloud Secure Vault
 */

// Create a debug logger that writes to console and can be displayed in UI
window.debugLog = function(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    
    // Log to console with appropriate styling
    switch(type) {
        case 'error':
            console.error(logMessage);
            break;
        case 'warning':
            console.warn(logMessage);
            break;
        case 'success':
            console.log('%c' + logMessage, 'color: green; font-weight: bold;');
            break;
        default:
            console.log(logMessage);
    }
    
    // Return the message for potential UI display
    return logMessage;
};

// Function to test local storage functionality
window.testLocalStorage = function() {
    debugLog('Testing local storage functionality...');
    
    try {
        // Test if IndexedDB is available
        if (!window.indexedDB) {
            debugLog('IndexedDB is not supported in this browser!', 'error');
            return false;
        }
        
        debugLog('IndexedDB is supported');
        
        // Test if we can open a database
        const request = window.indexedDB.open('testDatabase', 1);
        
        request.onerror = function(event) {
            debugLog('Error opening test database: ' + event.target.error, 'error');
            return false;
        };
        
        request.onsuccess = function(event) {
            debugLog('Successfully opened test database', 'success');
            const db = event.target.result;
            db.close();
            
            // Try to delete the test database
            const deleteRequest = window.indexedDB.deleteDatabase('testDatabase');
            deleteRequest.onsuccess = function() {
                debugLog('Test database deleted successfully', 'success');
            };
        };
        
        return true;
    } catch (error) {
        debugLog('Error testing local storage: ' + error.message, 'error');
        return false;
    }
};

// Initialize debug helper
debugLog('Debug helper initialized');
console.log('Debug helper loaded and available via window.debugLog()');
