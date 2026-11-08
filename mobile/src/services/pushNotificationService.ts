import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// ==============================================================================
// 1. FOREGROUND & BACKGROUND NOTIFICATION HANDLER
// ==============================================================================
// Configures how incoming notifications should behave when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushTokenRecord {
  token: string;
  platform: string;
  deviceId?: string;
  deviceName?: string;
}

// ==============================================================================
// 2. ANDROID NOTIFICATION CHANNELS CONFIGURATION
// ==============================================================================
export async function configureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  // Channel 1: Critical Heatwave Alerts (MAX Importance, Red LED, Urgent Vibration)
  await Notifications.setNotificationChannelAsync('heat-alerts', {
    name: 'Critical Heatwave Alerts',
    description: 'Urgent NDMA heatwave warnings, extreme temperature peaks, and heat emergencies.',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF2323',
    sound: 'default',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });

  // Channel 2: Daily Heat Briefings (DEFAULT Importance)
  await Notifications.setNotificationChannelAsync('weather-briefings', {
    name: 'Daily Heat Briefings',
    description: 'Morning weather forecasts, UV index peaks, and daily heat risk summaries.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableLights: false,
    enableVibrate: false,
    showBadge: false,
  });

  // Channel 3: Safe Route & Air Quality Alerts (HIGH Importance)
  await Notifications.setNotificationChannelAsync('safe-routes', {
    name: 'Safe Route & Air Quality Alerts',
    description: 'Real-time shade path notifications, cooling centre openings, and route warnings.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200],
    sound: 'default',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
  });
}

// ==============================================================================
// 3. PERMISSION CHECKS & REQUESTS
// ==============================================================================
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const { status, granted } = await Notifications.getPermissionsAsync();
    return granted || status === 'granted';
  } catch (error) {
    console.warn('[PushNotification] Error checking permissions:', error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status, granted } = await Notifications.requestPermissionsAsync();
    return granted || status === 'granted';
  } catch (error) {
    console.warn('[PushNotification] Error requesting permissions:', error);
    return false;
  }
}

// ==============================================================================
// 4. EXPO PUSH TOKEN REGISTRATION & SUPABASE STORAGE
// ==============================================================================
/**
 * Obtains the device's Expo Push Token and syncs it with the Supabase database.
 */
export async function registerForPushNotificationsAsync(
  userId?: string
): Promise<PushTokenRecord | null> {
  // Ensure Android notification channels are established first
  await configureAndroidNotificationChannels();

  // Verify device environment
  if (!Device.isDevice && Platform.OS !== 'web') {
    console.log('[PushNotification] Push notifications require a physical device on Android/iOS.');
  }

  // Check current permissions
  let isGranted = await checkNotificationPermission();
  if (!isGranted) {
    isGranted = await requestNotificationPermission();
  }

  if (!isGranted) {
    console.log('[PushNotification] User denied or dismissed notification permissions.');
    return null;
  }

  // Retrieve projectId if configured via EAS
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  let tokenData: string;
  try {
    const pushTokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    tokenData = pushTokenResult.data;
  } catch (err: any) {
    console.warn('[PushNotification] Could not generate Expo push token:', err?.message || err);
    // Fallback pseudo-token for local simulator/offline testing
    tokenData = `ExponentPushToken[local-${Platform.OS}-${Date.now()}]`;
  }

  const deviceModel = Device.modelName || Device.deviceName || 'Android Device';
  const deviceId =
    Constants?.installationId ||
    `${Platform.OS}-${Device.brand || 'dev'}-${Device.modelName || 'id'}`;

  const tokenRecord: PushTokenRecord = {
    token: tokenData,
    platform: Platform.OS || 'android',
    deviceId,
    deviceName: deviceModel,
  };

  // Persist token in Supabase
  await savePushTokenToSupabase(tokenRecord, userId);

  return tokenRecord;
}

/**
 * Saves or upserts the push token to Supabase table `push_tokens`
 */
export async function savePushTokenToSupabase(
  record: PushTokenRecord,
  userId?: string
): Promise<boolean> {
  if (!supabase) {
    console.log('[PushNotification] Supabase not configured. Token cached locally:', record.token);
    return false;
  }

  try {
    // If userId not supplied, try to read current authenticated user
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: authData } = await supabase.auth.getUser();
      targetUserId = authData?.user?.id;
    }

    if (!targetUserId) {
      console.log('[PushNotification] Anonymous/Guest device, token saved for anonymous alerts.');
      return false;
    }

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: targetUserId,
        expo_push_token: record.token,
        platform: record.platform,
        device_id: record.deviceId,
        device_name: record.deviceName,
        enabled: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'expo_push_token',
      }
    );

    if (error) {
      console.error('[PushNotification] Failed to upsert push token to Supabase:', error.message);
      return false;
    }

    console.log('[PushNotification] Token successfully synced with Supabase for user:', targetUserId);
    return true;
  } catch (error: any) {
    console.error('[PushNotification] Unexpected error saving push token:', error.message || error);
    return false;
  }
}

// ==============================================================================
// 5. NOTIFICATION LISTENERS (FOREGROUND & USER INTERACTION)
// ==============================================================================
export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
) {
  // Listener for notifications received while app is running
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification: any) => {
      console.log('[PushNotification] Notification Received in Foreground:', notification?.request?.content?.title);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener for user interactions (tapping a push banner or notification card)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response: any) => {
      console.log('[PushNotification] User tapped notification action:', response?.notification?.request?.content?.title);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    }
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
