// Supabase Configuration and Storage Integration
// This provides an alternative storage solution to Firebase for more reliable uploads

// Supabase configuration
const SUPABASE_URL = 'https://rpznczfcbshqukwiipvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwem5jemZjYnNocXVrd2lpcHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMjMzMDEsImV4cCI6MjA2MDY5OTMwMX0.V9VONiVdgihVZUqSORekt_E50l1iJcmj4VFxGY5tFKU';

// Load Supabase script directly in the HTML
document.addEventListener('DOMContentLoaded', function() {
  // Add Supabase script to the page
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = initSupabase;
  script.onerror = handleScriptError;
  document.head.appendChild(script);

  console.log('Supabase script loading...');
});

// Initialize Supabase client
let supabase = null;

// Initialize Supabase when the script is loaded
function initSupabase() {
  try {
    console.log('Supabase script loaded, initializing client...');
    // Create Supabase client
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');

    // Initialize the storage service
    window.supabaseStorage.onSupabaseLoaded(supabase);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Handle script loading error
function handleScriptError(error) {
  console.error('Error loading Supabase script:', error);
}

// Supabase Storage Service
class SupabaseStorageService {
  constructor() {
    this.initialized = false;
    this.bucketName = 'cloud-vault-files';
    this.supabase = null;
    this.maxFileSize = 50 * 1024 * 1024; // 50MB default limit
  }

  /**
   * Called when Supabase is loaded
   * @param {Object} supabaseClient - The Supabase client
   */
  onSupabaseLoaded(supabaseClient) {
    this.supabase = supabaseClient;
    console.log('Supabase client received by storage service');

    // Initialize the bucket
    this.ensureBucketExists().then(() => {
      this.initialized = true;
      console.log('Supabase storage initialized successfully');
    }).catch(error => {
      console.error('Failed to initialize bucket:', error);
    });
  }

  /**
   * Ensure the storage bucket exists
   * @returns {Promise<void>}
   */
  async ensureBucketExists() {
    if (!this.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    try {
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        console.log(`Creating bucket '${this.bucketName}'...`);
        const { error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false, // Set to private for security
          fileSizeLimit: this.maxFileSize,
          allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
          replicationCount: 1
        });

        if (error) {
          console.error('Bucket creation error:', error);
          return;
        }
      }
    } catch (error) {
      console.error('Bucket operation error:', error);
    }
  }

  /**
   * Check if the service is ready to use
   * @returns {Promise<boolean>}
   */
  async isReady() {
    // If already initialized, return true
    if (this.initialized && this.supabase) {
      return true;
    }

    // Wait for initialization to complete (max 5 seconds)
    let attempts = 0;
    const maxAttempts = 10;

    while (!this.initialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
      console.log(`Waiting for Supabase to initialize... (${attempts}/${maxAttempts})`);
    }

    return this.initialized && this.supabase !== null;
  }

  /**
   * Upload a file to Supabase Storage
   * @param {string} userId - The user ID
   * @param {File} file - The file to upload
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Promise<Object>} - A promise that resolves with the upload result
   */
  async uploadFile(userId, file, progressCallback = () => {}) {
    try {
      progressCallback(5, 'Waiting for Supabase to initialize...');

      // Make sure Supabase is initialized
      const isReady = await this.isReady();
      if (!isReady) {
        throw new Error('Supabase not initialized after waiting');
      }

      if (!this.supabase) {
        throw new Error('Supabase client not available');
      }

      // Create a clean filename (remove special characters)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = new Date().getTime();
      const filePath = `${userId}/${timestamp}_${cleanFileName}`;

      progressCallback(20, 'Starting upload to Supabase...');

      // Upload the file with progress updates
      let uploadProgress = 20;
      const progressInterval = setInterval(() => {
        if (uploadProgress < 80) {
          uploadProgress += 5;
          progressCallback(uploadProgress, `Uploading to Supabase... ${uploadProgress}%`);
        }
      }, 500);

      // Upload the file
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        });

      // Clear the progress interval
      clearInterval(progressInterval);

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      progressCallback(90, 'Getting file URL...');

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      progressCallback(100, 'Upload complete!');

      return {
        downloadURL: urlData.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type,
        name: file.name,
        timestamp,
        provider: 'supabase'
      };
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} filePath - The path of the file to delete
   * @returns {Promise<boolean>} - A promise that resolves to true if deletion was successful
   */
  async deleteFile(filePath) {
    try {
      // Make sure Supabase is initialized
      const isReady = await this.isReady();
      if (!isReady) {
        throw new Error('Supabase not initialized');
      }

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting file from Supabase:', error);
      return false;
    }
  }
}

// Export the Supabase storage service
window.supabaseStorage = new SupabaseStorageService();
console.log('Supabase storage service exported to window.supabaseStorage');

// Initialize Supabase immediately if the script is already loaded
if (window.supabase) {
  console.log('Supabase already loaded, initializing immediately');
  initSupabase();
} else {
  // Load Supabase script immediately instead of waiting for DOMContentLoaded
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = initSupabase;
  script.onerror = handleScriptError;
  document.head.appendChild(script);

  console.log('Supabase script loading immediately...');
}

