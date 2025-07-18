import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * @name NotificationProvider
 * @description Provides notification state management to the application.
 * @param {object} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components.
 * @returns {JSX.Element} The rendered NotificationProvider component.
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    // Demo notifications - in real app these would come from an API
    {
      id: '1',
      message: 'New invoice received from Acme Corp',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      read: false,
    },
    {
      id: '2',
      message: 'Monthly sales report is ready for review',
      type: 'success',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: false,
    },
    {
      id: '3',
      message: 'AI Assistant has new automation suggestions',
      type: 'info',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: false,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * @name useNotifications
 * @description Hook to access notification context.
 * @returns {NotificationContextType} The notification context value.
 */
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * @name formatTimeAgo
 * @description Utility function to format timestamp as "time ago" string.
 * @param {Date} timestamp - The timestamp to format.
 * @returns {string} The formatted time string.
 */
export const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}; 