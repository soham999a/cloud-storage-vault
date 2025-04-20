// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMx6WZxiJcmQ7e1lqJlenSqt9Ry3Iiphg",
  authDomain: "cloud0storage-vault.firebaseapp.com",
  projectId: "cloud0storage-vault",
  storageBucket: "cloud0storage-vault.appspot.com",
  messagingSenderId: "145631142887",
  appId: "1:145631142887:web:5b1746c38de4a142391342",
  measurementId: "G-J4653VGJQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
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
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful');
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },
  signOut: () => signOut(auth),
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  updateProfile: (user, data) => updateProfile(user, data),
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
