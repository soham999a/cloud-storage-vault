// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, db, storage, analytics };
