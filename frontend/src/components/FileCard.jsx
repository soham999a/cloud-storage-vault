import { useState } from 'react';
import { FaFile, FaDownload, FaTrash, FaEdit, FaImage, FaVideo, FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaShare } from 'react-icons/fa';
import { renameFile, generateShareableLink } from '../services/fileService';

const FileCard = ({ fileName, fileSize, uploadDate, onDelete, downloadUrl, fileId, filePath }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFileName, setNewFileName] = useState(fileName);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkExpiry, setShareLinkExpiry] = useState(24);
  const [error, setError] = useState('');

  // Determine file icon based on file name
  const getFileIcon = () => {
    const extension = fileName.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return <FaImage className="text-2xl text-primary" />;
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
      return <FaVideo className="text-2xl text-primary" />;
    } else if (extension === 'pdf') {
      return <FaFilePdf className="text-2xl text-primary" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FaFileWord className="text-2xl text-primary" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FaFileExcel className="text-2xl text-primary" />;
    } else if (['txt', 'md'].includes(extension)) {
      return <FaFileAlt className="text-2xl text-primary" />;
    } else {
      return <FaFile className="text-2xl text-primary" />;
    }
  };

  // Handle rename file
  const handleRename = async () => {
    if (!newFileName.trim()) {
      setError('File name cannot be empty');
      return;
    }

    try {
      await renameFile(fileId, newFileName);
      setIsRenaming(false);
      setError('');
    } catch (err) {
      setError('Failed to rename file: ' + err.message);
      console.error(err);
    }
  };

  // Handle generate shareable link
  const handleGenerateLink = async () => {
    try {
      setIsGeneratingLink(true);
      setError('');

      const { shareId } = await generateShareableLink(fileId, shareLinkExpiry);
      const link = `${window.location.origin}/share/${shareId}`;
      setShareLink(link);
    } catch (err) {
      setError('Failed to generate link: ' + err.message);
      console.error(err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Handle copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="card hover:border-primary transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getFileIcon()}
          <div>
            {isRenaming ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="input py-1"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                />
                <button
                  onClick={handleRename}
                  className="btn btn-primary py-1"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsRenaming(false);
                    setNewFileName(fileName);
                    setError('');
                  }}
                  className="btn btn-secondary py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h3 className="text-lg font-medium text-text">{fileName}</h3>
            )}
            <p className="text-sm text-text-muted">
              {fileSize} • {uploadDate}
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
            {shareLink && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="input py-1 text-sm"
                    value={shareLink}
                    readOnly
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-primary py-1 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Link expires in {shareLinkExpiry} hours
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {!isRenaming && !shareLink && (
            <>
              <button
                onClick={() => setIsRenaming(true)}
                className="p-2 text-text hover:text-primary transition-colors"
                title="Rename"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => {
                  setShareLink('');
                  setIsGeneratingLink(true);
                  handleGenerateLink();
                }}
                className="p-2 text-text hover:text-primary transition-colors"
                title="Share"
                disabled={isGeneratingLink}
              >
                <FaShare />
              </button>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-text hover:text-primary transition-colors"
                title="Download"
              >
                <FaDownload />
              </a>
              <button
                onClick={() => onDelete && onDelete()}
                className="p-2 text-text hover:text-red-500 transition-colors"
                title="Delete"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;