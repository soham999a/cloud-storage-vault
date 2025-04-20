/**
 * Vercel-specific authentication for Cloud Storage Vault
 * This file contains a simplified implementation of Google authentication
 * specifically designed to work on Vercel deployments
 */

// Import Firebase modules directly
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDQnxJpj0rlnKSeAKV5Qxj8YnxvTNmGQyY",
    authDomain: "cloud-storage-vault-c9e0c.firebaseapp.com",
    projectId: "cloud-storage-vault-c9e0c",
    storageBucket: "cloud-storage-vault-c9e0c.appspot.com",
    messagingSenderId: "1098024457778",
    appId: "1:1098024457778:web:0a5e5a2e0b4e3f3f3f3f3f",
    measurementId: "G-KEJ7VKNTZP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Log initialization
console.log('Vercel Auth: Firebase initialized');
console.log('Current domain:', window.location.origin);

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Simple notification function
function showAuthNotification(message, type = 'info') {
    console.log(`Auth Notification (${type}):`, message);

    // Check if the main notification function exists
    if (typeof window.showNotification === 'function') {
        window.showNotification(type, message, 5000);
    } else {
        // Create a simple notification if the main one doesn't exist
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';

        // Set colors based on type
        if (type === 'error') {
            notification.style.backgroundColor = '#f44336';
        } else if (type === 'success') {
            notification.style.backgroundColor = '#4CAF50';
        } else {
            notification.style.backgroundColor = '#2196F3';
        }

        notification.style.color = 'white';
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    }
}

// Add initialization check
function waitForFirebase(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        
        const check = () => {
            if (window.firebaseServices && window.firebaseServices.auth) {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error('Firebase initialization timeout'));
            } else {
                setTimeout(check, 100);
            }
        };
        
        check();
    });
}

// Check for redirect result on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Vercel Auth: Checking for redirect result');
    checkRedirectResult();

    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Vercel Auth: User is signed in', user.email);
            // Close modals if they exist
            const loginSection = document.getElementById('login-section');
            const registerSection = document.getElementById('register-section');

            if (loginSection) loginSection.classList.remove('active');
            if (registerSection) registerSection.remove('active');
        } else {
            console.log('Vercel Auth: No user signed in');
        }
    });
});

// Function to check redirect result
async function checkRedirectResult() {
    try {
        console.log('Vercel Auth: Checking redirect result');
        const result = await getRedirectResult(auth);

        if (result && result.user) {
            console.log('Vercel Auth: Successfully signed in after redirect', result.user.email);
            showAuthNotification('Successfully signed in with Google!', 'success');

            // Create user document if needed
            try {
                const userDoc = await getDoc(doc(db, 'users', result.user.uid));

                if (!userDoc.exists()) {
                    console.log('Vercel Auth: Creating new user document');
                    await setDoc(doc(db, 'users', result.user.uid), {
                        name: result.user.displayName || '',
                        email: result.user.email,
                        photoURL: result.user.photoURL || '',
                        storageUsed: 0,
                        fileCount: 0,
                        sharedFiles: 0,
                        provider: 'google',
                        createdAt: serverTimestamp()
                    });
                    showAuthNotification('Account created successfully!', 'success');
                }
            } catch (error) {
                console.error('Vercel Auth: Error creating user document', error);
            }
        } else {
            console.log('Vercel Auth: No redirect result found');
        }
    } catch (error) {
        console.error('Vercel Auth: Error checking redirect result', error);
        showAuthNotification('Error signing in: ' + error.message, 'error');
    }
}

// Function to sign in with Google
async function signInWithGoogle() {
    try {
        await waitForFirebase();
        // Proceed with sign-in
        await signInWithRedirect(auth, googleProvider);
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        throw error;
    }
}

// Export functions to window
window.vercelAuth = {
    signInWithGoogle,
    checkRedirectResult,
    auth
};

console.log('Vercel Auth: Module loaded and ready');

