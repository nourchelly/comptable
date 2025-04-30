import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaBell,  
  FaTimes, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaFileInvoice,
  FaChevronRight,
  FaRegBell,
  FaRegCheckCircle,
  FaRegClock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/notifications/', {
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.lue).length);
      }
    } catch (error) {
      toast.error("Erreur de chargement des notifications");
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/notifications/${notificationId}/read/`,
        {},
        { withCredentials: true }
      );
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, lue: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        'http://127.0.0.1:8000/api/notifications/read-all/',
        {},
        { withCredentials: true }
      );
      setNotifications(notifications.map(n => ({ ...n, lue: true })));
      setUnreadCount(0);
      toast.success("Toutes les notifications marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors du marquage des notifications");
      console.error("Erreur:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'signalement':
        return <FaExclamationTriangle className="text-red-500 text-lg" />;
      case 'avertissement':
        return <FaExclamationTriangle className="text-amber-500 text-lg" />;
      case 'facture':
        return <FaFileInvoice className="text-blue-500 text-lg" />;
      default:
        return <FaInfoCircle className="text-indigo-500 text-lg" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'signalement':
        return 'bg-red-50 border-red-100';
      case 'avertissement':
        return 'bg-amber-50 border-amber-100';
      case 'facture':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-indigo-50 border-indigo-100';
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Bouton de notification dans la navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <div className="relative">
            <FaBell className="text-xl text-gray-700" />
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs text-white font-medium">
              {unreadCount}
            </span>
          </div>
        ) : (
          <FaRegBell className="text-xl text-gray-500" />
        )}
      </button>

      {/* Fenêtre des notifications */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 border border-gray-200 overflow-hidden"
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FaBell className="text-lg" />
                <h3 className="font-semibold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full flex items-center transition-colors"
                    title="Marquer tout comme lu"
                  >
                    <FaRegCheckCircle className="mr-1" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                  title="Fermer"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="text-sm text-gray-500">Chargement...</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.lue ? getNotificationColor(notification.type_notification) : 'bg-white'
                    } border-l-4 ${!notification.lue ? 'border-indigo-400' : 'border-transparent'}`}
                    onClick={() => {
                      if (!notification.lue) {
                        markAsRead(notification.id);
                      }
                      // Navigation spécifique si besoin
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-lg ${
                        !notification.lue ? 'bg-white shadow-sm' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type_notification)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium truncate ${
                            !notification.lue ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.titre}
                          </p>
                          <FaChevronRight className="text-xs text-gray-400 mt-1 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <FaRegClock className="mr-1" />
                          <span>
                            {new Date(notification.date_creation).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                    <FaRegBell className="text-gray-400 text-xl" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Aucune notification</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Vous n'avez pas de nouvelles notifications pour le moment.
                  </p>
                </div>
              )}
            </div>

            {/* Pied de page */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
              <button
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                onClick={() => {
                  setIsOpen(false);
                  // Navigation vers une page de notifications complète
                }}
              >
                Voir toutes les notifications
                <FaChevronRight className="ml-1 text-xs" />
              </button>
              <span className="text-xs text-gray-500">
                {notifications.length} élément{notifications.length > 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;