# Cloud Storage Vault

A secure cloud storage solution with a 3D interface built using ReactJS, TailwindCSS, and Firebase.

## Features

- User authentication (signup, login, sign out, Google authentication)
- File management (upload, download, delete)
- Dashboard UI with 3D elements
- File sharing capabilities
- Custom styling
- Free tier with 5MB file size limit

## Technologies Used

- ReactJS
- TailwindCSS
- Firebase (Auth, Storage, Firestore)
- Three.js (for 3D elements)

## Deployment to Vercel

### Prerequisites

1. A Vercel account
2. Firebase project with Storage and Authentication enabled
3. (Optional) Supabase project

### Steps to Deploy

1. **Fork or Clone the Repository**

   ```
   git clone https://github.com/soham999a/cloud-storage-vault.git
   cd cloud-storage-vault
   ```

2. **Install Vercel CLI (Optional)**

   ```
   npm install -g vercel
   ```

3. **Deploy to Vercel**

   Option 1: Using Vercel CLI
   ```
   vercel
   ```

   Option 2: Using Vercel Dashboard
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project settings

4. **Set Environment Variables**

   In the Vercel dashboard, add the following environment variables:

   ```
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   
   NODE_ENV=production
   ```

5. **Deploy**

   Click "Deploy" in the Vercel dashboard.

## Local Development

1. **Clone the repository**

   ```
   git clone https://github.com/soham999a/cloud-storage-vault.git
   cd cloud-storage-vault
   ```

2. **Install dependencies**

   ```
   npm install
   ```

3. **Create a .env file**

   Copy the .env.example file to .env and fill in your Firebase and Supabase credentials.

4. **Start the development server**

   ```
   npm start
   ```

## License

MIT

## Author

Soham Das

