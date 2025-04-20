/**
 * Firebase Auth Domain Checker
 * This script helps diagnose issues with Firebase Authentication, particularly with Google Sign-in
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase Auth Checker initializing...');
    
    // Wait for Firebase to be initialized
    const checkFirebase = setInterval(function() {
        if (window.firebaseConfig && window.firebaseServices) {
            clearInterval(checkFirebase);
            runAuthChecks();
        }
    }, 1000);
    
    // Maximum wait time - 10 seconds
    setTimeout(function() {
        clearInterval(checkFirebase);
        console.error('Firebase Auth Checker: Timed out waiting for Firebase to initialize');
    }, 10000);
});

/**
 * Run a series of checks to diagnose Firebase Auth issues
 */
function runAuthChecks() {
    console.log('%c Firebase Auth Checker ', 'background: #FFA000; color: white; font-size: 14px; font-weight: bold; padding: 4px;');
    console.log('Running Firebase Authentication checks...');
    
    // Check 1: Firebase Config
    checkFirebaseConfig();
    
    // Check 2: Domain Authorization
    checkDomainAuthorization();
    
    // Check 3: Google Auth Provider
    checkGoogleAuthProvider();
    
    // Check 4: Auth State
    checkAuthState();
    
    // Final summary
    console.log('%c Firebase Auth Checks Complete ', 'background: #43A047; color: white; font-size: 14px; font-weight: bold; padding: 4px;');
    console.log('If you are experiencing issues with Google Sign-in, check the warnings above.');
    console.log('For unauthorized domain issues, add your domain to the Firebase Console:');
    console.log('Firebase Console > Authentication > Sign-in method > Authorized domains');
}

/**
 * Check if Firebase config is properly set up
 */
function checkFirebaseConfig() {
    console.log('📋 Checking Firebase Configuration...');
    
    const config = window.firebaseConfig;
    if (!config) {
        console.error('❌ Firebase config not found!');
        return;
    }
    
    // Check required fields
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
        console.error(`❌ Firebase config is missing required fields: ${missingFields.join(', ')}`);
    } else {
        console.log('✅ Firebase config has all required fields');
    }
    
    // Check auth domain specifically
    if (config.authDomain) {
        console.log(`📌 Auth Domain: ${config.authDomain}`);
    }
}

/**
 * Check if the current domain is authorized in Firebase
 */
function checkDomainAuthorization() {
    console.log('🔒 Checking Domain Authorization...');
    
    const currentDomain = window.location.origin;
    const authDomain = window.firebaseConfig?.authDomain;
    
    console.log(`📌 Current Domain: ${currentDomain}`);
    console.log(`📌 Auth Domain: ${authDomain}`);
    
    // Check if the current domain is the same as the auth domain or localhost
    const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
    const isAuthDomain = authDomain && (currentDomain.includes(authDomain) || authDomain.includes(currentDomain));
    const isVercelApp = currentDomain.includes('vercel.app');
    
    if (isLocalhost) {
        console.log('✅ Running on localhost - should be authorized for development');
    } else if (isAuthDomain) {
        console.log('✅ Current domain matches auth domain - should be authorized');
    } else if (isVercelApp) {
        console.log('⚠️ Running on Vercel app - make sure this domain is added to Firebase authorized domains');
    } else {
        console.warn('❌ Current domain may not be authorized in Firebase console!');
        console.warn(`Add ${currentDomain} to the authorized domains in Firebase console`);
    }
}

/**
 * Check if Google Auth Provider is properly configured
 */
function checkGoogleAuthProvider() {
    console.log('🔑 Checking Google Auth Provider...');
    
    if (!window.firebaseServices) {
        console.error('❌ Firebase services not found!');
        return;
    }
    
    if (!window.firebaseServices.signInWithGoogle) {
        console.error('❌ Google Sign-in method not found in Firebase services!');
        return;
    }
    
    console.log('✅ Google Auth Provider is available');
    
    // Check if popup mode is supported
    try {
        const popupSupported = typeof window.open === 'function';
        if (!popupSupported) {
            console.warn('⚠️ Popup windows may not be supported in this environment');
        } else {
            console.log('✅ Popup windows are supported');
        }
    } catch (e) {
        console.warn('⚠️ Could not check popup support:', e);
    }
}

/**
 * Check current authentication state
 */
function checkAuthState() {
    console.log('👤 Checking Authentication State...');
    
    if (!window.firebaseServices || !window.firebaseServices.auth) {
        console.error('❌ Firebase Auth not found!');
        return;
    }
    
    const user = window.firebaseServices.auth.currentUser;
    if (user) {
        console.log(`✅ User is signed in: ${user.email}`);
        console.log(`📌 Auth Provider: ${user.providerData[0]?.providerId || 'unknown'}`);
    } else {
        console.log('📌 No user is currently signed in');
    }
}

// Add a global function to manually run the checks
window.checkFirebaseAuth = runAuthChecks;

console.log('Firebase Auth Checker script loaded. Will run automatically when Firebase is ready.');
console.log('You can also run checks manually with window.checkFirebaseAuth()');
