import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaFile, FaTimes, FaUpload } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile } from '../services/fileService';
import { formatFileSize } from '../utils/formatters';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles([...files, ...droppedFiles]);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));

    // Also remove from progress tracking
    const fileToRemove = files[index];
    if (fileToRemove && uploadProgress[fileToRemove.name] !== undefined) {
      const newProgress = { ...uploadProgress };
      delete newProgress[fileToRemove.name];
      setUploadProgress(newProgress);
    }
  };

  // Calculate total upload progress
  const calculateTotalProgress = () => {
    if (files.length === 0) return 0;

    const totalProgress = Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / files.length);
  };

  // Handle file uploads
  const handleUploadFiles = async () => {
    if (!currentUser) {
      setError('You must be logged in to upload files');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create a new progress tracker
      const newProgress = {};
      files.forEach(file => {
        newProgress[file.name] = 0;
      });
      setUploadProgress(newProgress);

      // Upload each file
      const uploadPromises = files.map(async (file) => {
        try {
          // Track progress for this file
          const trackProgress = (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          };

          // Simulate progress updates (in a real app, this would come from the upload task)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const currentProgress = prev[file.name] || 0;
              if (currentProgress < 90) {
                return {
                  ...prev,
                  [file.name]: currentProgress + Math.random() * 10
                };
              }
              return prev;
            });
          }, 300);

          // Upload the file
          const result = await uploadFile(file, currentUser.uid);

          // Complete the progress
          clearInterval(progressInterval);
          trackProgress(100);

          return result;
        } catch (err) {
          setError(`Failed to upload ${file.name}: ${err.message}`);
          throw err;
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Navigate to dashboard after successful upload
      navigate('/');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text">Upload Files</h1>
      </div>

      <div
        className={`card border-2 border-dashed ${
          isDragging ? 'border-primary' : 'border-gray-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center py-12">
          <FaCloudUploadAlt className="mx-auto text-5xl text-primary mb-4" />
          <h3 className="text-xl font-medium text-text mb-2">
            Drag and drop files here
          </h3>
          <p className="text-text-muted mb-4">or</p>
          <label className="btn btn-primary cursor-pointer">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInput}
            />
            Browse Files
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-text mb-4">Selected Files</h2>
          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-background-light rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <FaFile className="text-2xl text-primary" />
                  <div>
                    <p className="text-text">{file.name}</p>
                    <p className="text-sm text-text-muted">
                      {formatFileSize(file.size)}
                    </p>
                    {uploadProgress[file.name] !== undefined && (
                      <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${uploadProgress[file.name]}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-text hover:text-red-500 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
              onClick={handleUploadFiles}
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading... {calculateTotalProgress()}%</span>
                </>
              ) : (
                <>
                  <FaUpload />
                  <span>Upload {files.length} {files.length === 1 ? 'File' : 'Files'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;