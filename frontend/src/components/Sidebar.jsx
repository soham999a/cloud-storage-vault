import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUpload, FaLock, FaSignOutAlt, FaCube, FaList, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { path: '/', icon: FaCube, label: '3D Dashboard' },
    { path: '/dashboard', icon: FaList, label: '2D Dashboard' },
    { path: '/upload', icon: FaUpload, label: 'Upload Files' },
  ];

  // Animation variants
  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.aside
      className="w-64 bg-background-dark border-r border-gray-800 min-h-screen"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-4">
        {currentUser && (
          <motion.div
            className="flex items-center space-x-3 p-4 mb-6 border-b border-gray-800"
            variants={itemVariants}
          >
            <FaUserCircle className="text-primary text-3xl" />
            <div className="overflow-hidden">
              <p className="text-text font-medium truncate">{currentUser.displayName || 'User'}</p>
              <p className="text-text-muted text-sm truncate">{currentUser.email}</p>
            </div>
          </motion.div>
        )}

        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-black'
                      : 'text-text hover:bg-background-light'
                  }`}
                >
                  <Icon className="mr-3" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {currentUser && (
          <motion.div
            className="mt-8 pt-4 border-t border-gray-800"
            variants={itemVariants}
          >
            <motion.button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-background-light rounded-md transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FaSignOutAlt className="mr-3" />
              Sign Out
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;