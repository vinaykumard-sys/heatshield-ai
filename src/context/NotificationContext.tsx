import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { mockDb } from '../lib/mockDb';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  sendNotification: (notif: Omit<AppNotification, 'id' | 'created_at'>) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshNotifications = () => {
    const list = mockDb.getNotifications(user?.id);
    setNotifications(list);
  };

  useEffect(() => {
    refreshNotifications();
  }, [user]);

  const markAsRead = (id: string) => {
    mockDb.markNotificationRead(id);
    refreshNotifications();
  };

  const markAllAsRead = () => {
    mockDb.markAllNotificationsRead();
    refreshNotifications();
  };

  const sendNotification = (notif: Omit<AppNotification, 'id' | 'created_at'>) => {
    mockDb.addNotification(notif);
    refreshNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
