# Cloud Secure Vault

A modern, secure Cloud Storage Vault web application using ReactJS, TailwindCSS, and Firebase.

## Features

- User Authentication (Email/Password and Google OAuth)
- File Upload & Management
- Dashboard UI with file sorting and filtering
- File Sharing with expiration links
- Dark mode theme

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Enable Authentication (Email/Password and Google providers)
5. Enable Firestore Database
6. Enable Storage
7. Set up security rules for Firestore and Storage

### 2. Configure Firebase in the App

1. Open `src/firebase/config.js`
2. Replace the placeholder values with your Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 3. Firestore Security Rules

Add these security rules to your Firestore database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write only their own data
    match /files/{fileId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Allow access to shared files
    match /shares/{shareId} {
      allow read: if true;
      allow create: if request.auth != null;

      // Only the file owner can delete shares
      allow delete: if request.auth != null &&
                     get(/databases/$(database)/documents/files/$(resource.data.fileId)).data.userId == request.auth.uid;
    }
  }
}
```

### 4. Storage Security Rules

Add these security rules to your Firebase Storage:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Files can only be read by their owner
    match /files/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Shared files can be read by anyone with the link
    match /shared/{fileId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Running the App

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Project Structure

- `src/components`: Reusable UI components
- `src/contexts`: React context providers
- `src/firebase`: Firebase configuration
- `src/pages`: Application pages
- `src/services`: Firebase service functions
- `src/utils`: Utility functions

## Additional Features

- **Folder Creation**: Create folders to organize your files
- **Drag and Drop**: Easy file uploading with drag and drop
- **Storage Usage**: Track your storage usage
