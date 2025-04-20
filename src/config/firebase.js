// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWNEGsiOzHAV8Kim6AUmE2BzgUNmBILnc",
  authDomain: "cloud-storage-vault.firebaseapp.com",
  projectId: "cloud-storage-vault",
  storageBucket: "cloud-storage-vault.firebasestorage.app",
  messagingSenderId: "873413278959",
  appId: "1:873413278959:web:f4c8aef971d7038cb5ef1a",
  measurementId: "G-KEJ7VKNTZP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };