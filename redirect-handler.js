/**
 * Redirect Handler for Firebase Authentication
 * This script handles the redirect result from Google sign-in
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Redirect Handler initializing...');
    
    // Listen for Firebase initialization
    window.addEventListener('firebaseInitialized', () => {
        console.log('Firebase initialized, checking redirect result...');
        checkRedirectResult();
    });

    // Set a reasonable timeout
    const timeout = setTimeout(() => {
        if (!window.firebaseServices?.initialized) {
            console.error('Firebase initialization timed out');
            // Show user-friendly error message
            if (typeof showNotification === 'function') {
                showNotification('error', 'Authentication service initialization failed. Please refresh the page.');
            }
        }
    }, 15000); // 15 seconds timeout

    // Cleanup timeout if Firebase initializes
    window.addEventListener('firebaseInitialized', () => clearTimeout(timeout));
});

/**
 * Check for redirect result from Firebase Authentication
 */
function checkRedirectResult() {
    console.log('Checking for redirect result...');
    
    // Wait for Firebase to initialize
    const checkFirebase = setInterval(function() {
        if (window.firebaseServices && window.firebaseServices.getRedirectResult) {
            clearInterval(checkFirebase);
            handleRedirectResult();
        }
    }, 500);
    
    // Maximum wait time - 10 seconds
    setTimeout(function() {
        clearInterval(checkFirebase);
        console.error('Redirect Handler: Timed out waiting for Firebase to initialize');
    }, 10000);
}

/**
 * Handle the redirect result from Firebase Authentication
 */
function handleRedirectResult() {
    console.log('Processing redirect result...');
    
    window.firebaseServices.getRedirectResult()
        .then(function(result) {
            if (result && result.user) {
                console.log('Successfully signed in after redirect:', result.user.email);
                
                // Close login/register modals if open
                const loginSection = document.getElementById('login-section');
                const registerSection = document.getElementById('register-section');
                
                if (loginSection) loginSection.classList.remove('active');
                if (registerSection) registerSection.classList.remove('active');
                
                // Show success notification
                if (typeof showNotification === 'function') {
                    showNotification('success', 'Successfully signed in with Google!', 3000);
                } else {
                    console.log('showNotification function not available');
                }
                
                // Check if user document exists, if not create one
                if (window.firebaseServices.getUserDocument) {
                    window.firebaseServices.getUserDocument(result.user.uid)
                        .then(function(userData) {
                            if (!userData) {
                                // Create user document for Google sign-in
                                return window.firebaseServices.createUserDocument(result.user.uid, {
                                    name: result.user.displayName || '',
                                    email: result.user.email,
                                    photoURL: result.user.photoURL || '',
                                    storageUsed: 0,
                                    fileCount: 0,
                                    sharedFiles: 0,
                                    provider: 'google'
                                }).then(function() {
                                    if (typeof showNotification === 'function') {
                                        showNotification('success', 'Account created successfully with Google!', 3000);
                                    }
                                });
                            } else {
                                console.log('User document already exists');
                            }
                        })
                        .catch(function(error) {
                            console.error('Error checking/creating user document:', error);
                        });
                }
            } else {
                console.log('No redirect result found or user already processed');
            }
        })
        .catch(function(error) {
            console.error('Error getting redirect result:', error);
            
            // Show error notification
            if (typeof showNotification === 'function') {
                if (error.code === 'auth/credential-already-in-use') {
                    showNotification('error', 'This Google account is already linked to another account', 5000);
                } else {
                    showNotification('error', 'Error signing in with Google: ' + error.message, 5000);
                }
            }
        });
}

// Export the function for direct use
window.checkFirebaseRedirect = checkRedirectResult;

console.log('Redirect Handler script loaded');

