import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { storage, db } from '../firebase/config';

// Upload a file to Firebase Storage and save metadata to Firestore
export const uploadFile = async (file, userId) => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `files/${userId}/${file.name}`);
    
    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Get upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Handle unsuccessful uploads
          reject(error);
        },
        async () => {
          // Handle successful uploads
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save file metadata to Firestore
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            userId,
            path: `files/${userId}/${file.name}`,
            downloadURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const docRef = await addDoc(collection(db, 'files'), fileData);
          resolve({ id: docRef.id, ...fileData });
        }
      );
    });
  } catch (error) {
    throw error;
  }
};

// Get all files for a user
export const getUserFiles = async (userId, sortBy = 'createdAt', sortDirection = 'desc') => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef, 
      where('userId', '==', userId),
      orderBy(sortBy, sortDirection)
    );
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    
    return files;
  } catch (error) {
    throw error;
  }
};

// Delete a file from Storage and Firestore
export const deleteFile = async (fileId, filePath) => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'files', fileId));
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Rename a file
export const renameFile = async (fileId, newName) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    
    await updateDoc(fileRef, {
      name: newName,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Generate a shareable link with expiration
export const generateShareableLink = async (fileId, expirationHours = 24) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    
    // Calculate expiration timestamp
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + expirationHours);
    
    // Create a share record
    const shareData = {
      fileId,
      expiresAt: expirationTime,
      createdAt: serverTimestamp()
    };
    
    const shareRef = await addDoc(collection(db, 'shares'), shareData);
    
    return {
      shareId: shareRef.id,
      expiresAt: expirationTime
    };
  } catch (error) {
    throw error;
  }
};

// Get file statistics for a user
export const getUserFileStats = async (userId) => {
  try {
    const files = await getUserFiles(userId);
    
    // Calculate total size
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    
    // Get last upload date
    let lastUpload = null;
    if (files.length > 0) {
      // Sort by createdAt in descending order
      const sortedFiles = [...files].sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      lastUpload = sortedFiles[0].createdAt;
    }
    
    return {
      totalFiles: files.length,
      totalSize,
      lastUpload
    };
  } catch (error) {
    throw error;
  }
};
