// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAWNEGsiOzHAV8Kim6AUmE2BzgUNmBILnc",
  authDomain: "cloud-storage-vault.firebaseapp.com",
  projectId: "cloud-storage-vault",
  storageBucket: "cloud-storage-vault.firebasestorage.app",
  messagingSenderId: "873413278959",
  appId: "1:873413278959:web:f4c8aef971d7038cb5ef1a",
  measurementId: "G-KEJ7VKNTZP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, db, storage, analytics };

