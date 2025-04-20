import { Link } from 'react-router-dom';
import { FaLock, FaUser, FaSignOutAlt, FaShieldAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleLogoutConfirm = () => {
    setShowLogoutConfirm(!showLogoutConfirm);
  };

  return (
    <motion.nav
      className="bg-background-dark border-b border-gray-800 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, 0, -15, 0] }}
                transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatDelay: 5 }}
              >
                <FaShieldAlt className="text-primary text-2xl mr-2" />
              </motion.div>
              <span className="text-xl font-mono text-primary">Cloud Secure Vault</span>
            </Link>
          </motion.div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <motion.div
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaUserCircle className="text-primary text-2xl" />
                  <span className="text-text hidden md:inline">{currentUser.displayName || currentUser.email}</span>
                </motion.div>

                {isMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-background-dark border border-gray-800 rounded-md shadow-lg py-1 z-10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 py-2 text-sm text-text-muted border-b border-gray-800">
                      Signed in as<br />
                      <span className="font-semibold text-text">{currentUser.email}</span>
                    </div>

                    <Link to="/" className="block px-4 py-2 text-sm text-text hover:bg-background-light" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                    <Link to="/upload" className="block px-4 py-2 text-sm text-text hover:bg-background-light" onClick={() => setIsMenuOpen(false)}>Upload Files</Link>

                    <button
                      onClick={toggleLogoutConfirm}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-background-light"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}

                {/* Logout confirmation modal */}
                {showLogoutConfirm && (
                  <motion.div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-background-dark p-6 rounded-lg shadow-xl max-w-sm w-full"
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                    >
                      <h3 className="text-xl font-bold text-text mb-4">Sign Out</h3>
                      <p className="text-text-muted mb-6">Are you sure you want to sign out from Cloud Secure Vault?</p>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowLogoutConfirm(false)}
                          className="px-4 py-2 rounded-md border border-gray-800 text-text hover:bg-background-light transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/login" className="flex items-center space-x-2 text-text hover:text-primary transition-colors px-4 py-2 border border-gray-800 rounded-md">
                  <FaUser className="text-lg" />
                  <span>Sign In</span>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;