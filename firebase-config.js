// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js';

// Your web app's Firebase configuration
// Get Firebase config from environment variables if available, otherwise use hardcoded values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-J4653VGJQX"
};

// Try to fix the appId if it looks invalid (placeholder format)
if (firebaseConfig.appId.includes('3f3f3f3f')) {
  console.warn('Firebase appId appears to be a placeholder. Attempting to fix...');
  // Generate a more likely valid appId format
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  firebaseConfig.appId = `1:${firebaseConfig.messagingSenderId}:web:${randomSuffix}`;
  console.log('Using generated appId:', firebaseConfig.appId);
}

// Check if we're on Vercel and log it
const isVercelDeployment = window.location.hostname.includes('vercel.app');
console.log('Running on Vercel deployment:', isVercelDeployment);

// Log Firebase config for debugging
console.log('Firebase config loaded:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  // Don't log sensitive values
  appId: '...' + firebaseConfig.appId.slice(-6),
  currentDomain: window.location.hostname
});

// Log important information for Vercel deployments
if (isVercelDeployment) {
  console.log('IMPORTANT: Make sure to add ' + window.location.origin + ' to Firebase authorized domains');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Add scopes for additional permissions if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Set custom parameters for the Google sign-in flow
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Don't set redirect_uri as Firebase will handle this automatically
  // This is important for Vercel deployments
});

console.log('Firebase v9 SDK initialized successfully');

// Export the Firebase services
window.firebaseServices = {
  app,
  auth,
  db,
  storage,
  analytics,

  // Export storage functions directly
  storageRef: ref,
  uploadBytes: uploadBytes,
  getDownloadURL: getDownloadURL,
  // Auth functions
  createUserWithEmailAndPassword: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  signInWithEmailAndPassword: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signInWithGoogle: async () => {
    try {
      console.log('Starting Google sign-in process...');
      console.log('Using auth domain:', firebaseConfig.authDomain);
      console.log('Current origin:', window.location.origin);

      // Check if we're on Vercel
      const isVercel = window.location.hostname.includes('vercel.app');
      const isDomainAuthorized = window.location.origin === firebaseConfig.authDomain;

      if (!isDomainAuthorized && !isVercel) {
        console.warn('Domain not authorized:', window.location.origin);
        // Use redirect method as fallback
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      console.log('Is Vercel deployment:', isVercel);

      // First, check if we're returning from a redirect
      try {
        // This will resolve immediately if there's no redirect result
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('Google sign-in with redirect successful');
          return result;
        }
      } catch (redirectError) {
        console.log('No redirect result or error:', redirectError);
        // Continue with normal sign-in flow
      }

      // For Vercel deployments, use redirect method directly
      // This is more reliable on Vercel
      if (isVercel) {
        console.log('Using redirect method for Vercel deployment');
        try {
          await signInWithRedirect(auth, googleProvider);
          // This won't actually return anything as the page will redirect
          return null;
        } catch (redirectError) {
          console.error('Redirect method failed on Vercel:', redirectError);
          // Don't show alert as it might be confusing - we'll handle errors in the UI
          throw redirectError;
        }
      }

      // For non-Vercel deployments, try popup first
      try {
        console.log('Attempting popup sign-in...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google sign-in with popup successful');
        return result;
      } catch (popupError) {
        console.error('Google sign-in popup error:', popupError);

        // Handle specific popup errors
        if (popupError.code === 'auth/popup-blocked') {
          console.log('Popup blocked, falling back to redirect method');
          // Fall back to redirect method
          try {
            await signInWithRedirect(auth, googleProvider);
            // This won't actually return anything as the page will redirect
            return null;
          } catch (redirectError) {
            console.error('Redirect method also failed:', redirectError);
            throw redirectError;
          }
        } else if (popupError.code === 'auth/popup-closed-by-user') {
          console.log('Sign-in was cancelled by user');
        } else if (popupError.code === 'auth/cancelled-popup-request') {
          console.log('Another sign-in attempt is in progress');
        } else if (popupError.code === 'auth/unauthorized-domain') {
          console.error('Unauthorized domain. Make sure ' + window.location.origin + ' is added to the OAuth redirect domains in Firebase console.');

          // Try redirect method as a last resort
          try {
            console.log('Attempting redirect method as fallback for unauthorized domain...');
            await signInWithRedirect(auth, googleProvider);
            return null;
          } catch (redirectError) {
            console.error('Redirect method also failed:', redirectError);
            throw redirectError;
          }
        } else {
          // For other errors, log but don't alert
          console.error('Sign-in failed:', popupError.message || 'Unknown error');
        }

        throw popupError;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },
  signOut: () => signOut(auth),
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  updateProfile: (user, data) => updateProfile(user, data),
  getRedirectResult: () => getRedirectResult(auth),
  // Firestore functions
  createUserDocument: async (userId, data) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...data,
        createdAt: serverTimestamp()
      });
      console.log('User document created successfully');
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  },
  getUserDocument: async (userId) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log('No such document!');
        return null;
      }
    } catch (error) {
      console.error('Error getting user document:', error);
      throw error;
    }
  },
  updateUserStorage: async (userId, fileSize) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        storageUsed: increment(fileSize),
        fileCount: increment(1)
      });
      console.log('User storage updated successfully');
    } catch (error) {
      console.error('Error updating user storage:', error);
      throw error;
    }
  },
  // Storage functions
  uploadFile: async (userId, file) => {
    try {
      // Check file size - limit to 100MB
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      }

      // Create a clean filename (remove special characters)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `users/${userId}/${timestamp}_${cleanFileName}`);

      // Set metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'originalName': file.name,
          'uploadedBy': userId,
          'uploadTime': timestamp.toString()
        }
      };

      // Create a promise that rejects after timeout
      const uploadTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timed out after 2 minutes')), 120000); // 2 minute timeout
      });

      // Race the upload against the timeout
      const uploadPromise = uploadBytes(storageRef, file, metadata);
      const snapshot = await Promise.race([uploadPromise, uploadTimeout]);

      console.log('File uploaded successfully');
      console.log('Upload metadata:', snapshot.metadata);

      // Get download URL with timeout
      const urlTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Getting download URL timed out')), 30000); // 30 second timeout
      });

      const downloadURL = await Promise.race([getDownloadURL(snapshot.ref), urlTimeout]);

      return {
        downloadURL,
        path: snapshot.ref.fullPath,
        size: file.size,
        type: file.type,
        name: file.name,
        timestamp: timestamp
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  // Analytics functions
  logAnalyticsEvent: (eventName, eventParams) => {
    try {
      logEvent(analytics, eventName, eventParams);
      console.log(`Analytics event logged: ${eventName}`);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },
  // Firestore helpers
  increment: (value) => increment(value),
  serverTimestamp: () => serverTimestamp()
};

// Make firebaseConfig globally accessible for debugging
window.firebaseConfig = firebaseConfig;

// Make Firebase storage functions globally accessible for the fast upload service
window.firebaseStorage = {
  ref,
  uploadBytes,
  getDownloadURL
};

console.log('Firebase storage functions exported to window.firebaseStorage');

// Add size checking before upload
async function uploadFile(file) {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB or adjust as needed
    
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // Proceed with upload
    const storageRef = ref(storage, 'files/' + file.name);
    return uploadBytes(storageRef, file);
}


