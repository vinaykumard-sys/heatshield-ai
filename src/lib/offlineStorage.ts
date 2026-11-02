import { useState, useEffect } from 'react';
import { mockDb } from './mockDb';

export interface OfflineAction {
  id: string;
  type: 'welfare_checkin' | 'assistance_request' | 'water_station_report';
  payload: any;
  queuedAt: string;
}

// Network Status Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(() => mockDb.getOfflineQueue().length);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    const queue = mockDb.getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      // Simulate network sync delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Process pending actions
      queue.forEach(item => {
        if (item.type === 'welfare_checkin') {
          mockDb.addCheckin(item.payload);
        } else if (item.type === 'assistance_request') {
          mockDb.saveRequest(item.payload);
        }
      });

      mockDb.clearOfflineQueue();
      setPendingCount(0);
    } catch (err) {
      console.warn('Offline sync encountered an error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const queueAction = (type: OfflineAction['type'], payload: any) => {
    mockDb.queueOfflineAction(type, payload);
    setPendingCount(mockDb.getOfflineQueue().length);
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncOfflineQueue,
    queueAction
  };
}

// Service worker register helper
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('ServiceWorker registration error:', err);
      });
    });
  }
}
