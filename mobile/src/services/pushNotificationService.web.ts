// Web-safe implementation of Push Notification Service
// Bypasses native expo-notifications on web/WebView to avoid LegacyEventEmitter constructor errors

export interface PushTokenRecord {
  token: string;
  platform: string;
  deviceId?: string;
  deviceName?: string;
}

export type NotificationTargetScreen = 'dashboard' | 'routes' | 'sos' | 'assistant' | 'profile';

export async function configureAndroidNotificationChannels(): Promise<void> {
  // No-op on web
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      return false;
    }
  }
  return true;
}

export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  return null;
}

export async function savePushTokenToSupabase(record: PushTokenRecord, userId?: string): Promise<boolean> {
  return true;
}

export function resolveNotificationRoute(notificationData: any): NotificationTargetScreen {
  return 'dashboard';
}

export async function checkInitialNotificationResponse(): Promise<any | null> {
  return null;
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
): () => void {
  // Return cleanup no-op
  return () => {};
}
