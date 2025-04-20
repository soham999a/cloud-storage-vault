import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaUpload, FaFolder, FaFile, FaSort, FaFilter, FaArrowLeft, FaHome } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getUserFiles, getUserFileStats, deleteFile } from '../services/fileService';
import { formatFileSize, formatDate } from '../utils/formatters';
import FileExplorerScene from '../components/3d/FileExplorerScene';

const Dashboard3D = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    lastUpload: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileDetails, setShowFileDetails] = useState(false);

  // Fetch user files and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Get user files
        const userFiles = await getUserFiles(currentUser.uid, sortBy, sortDirection);
        
        // Apply file type filter if needed
        let filteredFiles = userFiles;
        if (filterType !== 'all') {
          filteredFiles = userFiles.filter(file => {
            if (filterType === 'documents') {
              return file.type.includes('document') || 
                     file.type.includes('pdf') || 
                     file.type.includes('text');
            } else if (filterType === 'images') {
              return file.type.includes('image');
            } else if (filterType === 'videos') {
              return file.type.includes('video');
            }
            return true;
          });
        }
        
        // For demo purposes, create some mock folders
        const mockFolders = [
          { id: 'folder-1', name: 'Documents', path: '/Documents' },
          { id: 'folder-2', name: 'Images', path: '/Images' },
          { id: 'folder-3', name: 'Videos', path: '/Videos' },
        ];
        
        setFiles(filteredFiles);
        setFolders(mockFolders);
        
        // Get user file stats
        const fileStats = await getUserFileStats(currentUser.uid);
        setStats({
          totalFiles: fileStats.totalFiles,
          totalSize: fileStats.totalSize,
          lastUpload: fileStats.lastUpload,
        });
      } catch (err) {
        setError('Failed to load files: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, sortBy, sortDirection, filterType]);

  // Handle file deletion
  const handleDeleteFile = async (fileId, filePath) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await deleteFile(fileId, filePath);
      // Update the files list
      setFiles(files.filter(file => file.id !== fileId));
      // Update stats
      setStats(prev => ({
        ...prev,
        totalFiles: prev.totalFiles - 1
      }));
      // Close file details if the deleted file was selected
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(null);
        setShowFileDetails(false);
      }
    } catch (err) {
      setError('Failed to delete file: ' + err.message);
      console.error(err);
    }
  };

  // Handle file click
  const handleFileClick = (file) => {
    setSelectedFile(file);
    setShowFileDetails(true);
  };

  // Handle folder click
  const handleFolderClick = (folder) => {
    setCurrentPath(folder.path);
  };

  // Handle back button click
  const handleBackClick = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const newPath = pathParts.join('/') || '/';
    setCurrentPath(newPath);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats Section */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary bg-opacity-20">
              <FaFile className="text-2xl text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Total Files</h3>
              <p className="text-2xl font-bold text-text">{stats.totalFiles || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-secondary bg-opacity-20">
              <FaFolder className="text-2xl text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Storage Used</h3>
              <p className="text-2xl font-bold text-text">{formatFileSize(stats.totalSize) || '0 B'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-primary bg-opacity-20">
              <FaUpload className="text-2xl text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Last Upload</h3>
              <p className="text-2xl font-bold text-text">{stats.lastUpload ? formatDate(stats.lastUpload.toDate()) : 'No uploads yet'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls Section */}
      <motion.div 
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleBackClick}
            className="btn btn-secondary py-1 px-3 flex items-center space-x-1"
            disabled={currentPath === '/'}
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>
          
          <button 
            onClick={() => setCurrentPath('/')}
            className="btn btn-secondary py-1 px-3 flex items-center space-x-1"
          >
            <FaHome />
            <span>Home</span>
          </button>
          
          <div className="text-text-muted">
            Current Path: {currentPath}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <select
              className="input py-1 pl-8 pr-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Files</option>
              <option value="documents">Documents</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
            </select>
            <FaFilter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-muted" />
          </div>
          <div className="relative">
            <select
              className="input py-1 pl-8 pr-2"
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [newSortBy, newSortDirection] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortDirection(newSortDirection);
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Size (Largest)</option>
              <option value="size-asc">Size (Smallest)</option>
            </select>
            <FaSort className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      </motion.div>

      {/* 3D File Explorer */}
      <motion.div 
        className="flex-1 card overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{ minHeight: '500px' }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-text-muted mb-4">No files found. Upload your first file!</p>
            <Link to="/upload" className="btn btn-primary inline-block">
              Upload Files
            </Link>
          </div>
        ) : (
          <FileExplorerScene 
            files={files}
            folders={folders}
            onFileClick={handleFileClick}
            onFolderClick={handleFolderClick}
            currentPath={currentPath}
          />
        )}
      </motion.div>

      {/* File Details Modal */}
      {showFileDetails && selectedFile && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="card w-full max-w-md"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-text">File Details</h2>
              <button 
                onClick={() => setShowFileDetails(false)}
                className="text-text-muted hover:text-text"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-muted">File Name</h3>
                <p className="text-text">{selectedFile.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-text-muted">File Size</h3>
                <p className="text-text">{formatFileSize(selectedFile.size)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-text-muted">Upload Date</h3>
                <p className="text-text">
                  {selectedFile.createdAt ? formatDate(selectedFile.createdAt.toDate()) : 'Unknown'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-text-muted">File Type</h3>
                <p className="text-text">{selectedFile.type || 'Unknown'}</p>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <a 
                  href={selectedFile.downloadURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-1"
                >
                  Download
                </a>
                <button 
                  onClick={() => {
                    handleDeleteFile(selectedFile.id, selectedFile.path);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard3D;
