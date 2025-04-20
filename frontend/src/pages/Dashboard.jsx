import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { FaUpload, FaFolder, FaFile, FaSort, FaFilter } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getUserFiles, getUserFileStats, deleteFile } from '../services/fileService';
import { formatFileSize, formatDate } from '../utils/formatters';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
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

        setFiles(filteredFiles);

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
    } catch (err) {
      setError('Failed to delete file: ' + err.message);
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        <Link to="/upload">
          <button className="btn btn-primary flex items-center space-x-2">
            <FaUpload />
            <span>Upload Files</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
              <FaFile className="text-2xl text-primary" />
            </div>
            <div>
              <p className="text-text-muted">Total Files</p>
              <p className="text-2xl font-bold text-text">{stats.totalFiles || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
              <FaFolder className="text-2xl text-primary" />
            </div>
            <div>
              <p className="text-text-muted">Total Size</p>
              <p className="text-2xl font-bold text-text">{formatFileSize(stats.totalSize) || '0 B'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
              <FaUpload className="text-2xl text-primary" />
            </div>
            <div>
              <p className="text-text-muted">Last Upload</p>
              <p className="text-2xl font-bold text-text">{stats.lastUpload ? formatDate(stats.lastUpload.toDate()) : 'No uploads yet'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text">Your Files</h2>
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
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-text-muted">Loading files...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded">
            {error}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted">No files found. Upload your first file!</p>
            <Link to="/upload" className="btn btn-primary mt-4 inline-block">
              Upload Files
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                fileName={file.name}
                fileSize={formatFileSize(file.size)}
                uploadDate={file.createdAt ? formatDate(file.createdAt.toDate()) : 'Unknown'}
                onDelete={() => handleDeleteFile(file.id, file.path)}
                downloadUrl={file.downloadURL}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;