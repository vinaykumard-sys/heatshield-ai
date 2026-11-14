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

export type NotificationTargetScreen = 'dashboard' | 'routes' | 'sos' | 'assistant' | 'profile';

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

  // Channel 4: SOS Emergency & Relief Alerts (MAX Importance)
  await Notifications.setNotificationChannelAsync('emergency-sos', {
    name: 'SOS Emergency & Relief Alerts',
    description: 'Urgent heat safety emergency alerts, responder check-ins, and cooling relief dispatches.',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#EF4444',
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
 * Obtains the device's real Expo Push Token and syncs it with the Supabase database.
 * No hardcoded or fake notifications/tokens are created.
 */
export async function registerForPushNotificationsAsync(
  userId?: string
): Promise<PushTokenRecord | null> {
  // Ensure Android notification channels are established first
  await configureAndroidNotificationChannels();

  // Verify device environment
  if (!Device.isDevice && Platform.OS !== 'web') {
    console.log('[PushNotification] Physical device recommended for native push notification delivery.');
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

  let tokenData: string | null = null;
  try {
    const pushTokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    tokenData = pushTokenResult.data;
  } catch (err: any) {
    console.warn('[PushNotification] Could not generate Expo push token (offline or development simulator):', err?.message || err);
    // Real notification flow: do not generate fake tokens when generation fails
    return null;
  }

  if (!tokenData) {
    return null;
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
 * Saves or upserts the push token to Supabase table `push_tokens` (with fallback to `user_devices`)
 */
export async function savePushTokenToSupabase(
  record: PushTokenRecord,
  userId?: string
): Promise<boolean> {
  if (!supabase) {
    console.log('[PushNotification] Supabase not configured. Push token sync skipped.');
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
      console.log('[PushNotification] Anonymous/Guest device, token saved locally.');
      return false;
    }

    const nowIso = new Date().toISOString();

    // 1. Primary: push_tokens table
    const { error: pushTokensError } = await supabase.from('push_tokens').upsert(
      {
        user_id: targetUserId,
        expo_push_token: record.token,
        platform: record.platform,
        device_id: record.deviceId,
        device_name: record.deviceName,
        enabled: true,
        last_seen_at: nowIso,
        updated_at: nowIso,
      },
      {
        onConflict: 'expo_push_token',
      }
    );

    if (!pushTokensError) {
      console.log('[PushNotification] Token successfully synced with Supabase push_tokens for user:', targetUserId);
      return true;
    }

    // 2. Compatibility fallback: user_devices table if present
    const { error: deviceError } = await supabase.from('user_devices').upsert(
      {
        user_id: targetUserId,
        device_token: record.token,
        platform: record.platform,
        device_id: record.deviceId,
        device_name: record.deviceName,
        is_active: true,
        updated_at: nowIso,
      },
      {
        onConflict: 'device_token',
      }
    );

    if (!deviceError) {
      console.log('[PushNotification] Token synced with user_devices fallback for user:', targetUserId);
      return true;
    }

    console.warn('[PushNotification] Push token sync warning:', pushTokensError.message);
    return false;
  } catch (error: any) {
    console.warn('[PushNotification] Error during push token persistence:', error.message || error);
    return false;
  }
}

// ==============================================================================
// 5. NOTIFICATION ROUTING & RESOLUTION
// ==============================================================================
/**
 * Resolves notification payload to the appropriate screen in the app.
 */
export function resolveNotificationRoute(notificationData: any): NotificationTargetScreen {
  if (!notificationData) return 'dashboard';
  const type = String(notificationData.type || '').toUpperCase();
  const channelId = String(notificationData.channelId || '');

  if (type === 'SAFE_ROUTE' || channelId === 'safe-routes') {
    return 'routes';
  }
  if (type === 'SOS_ALERT' || type === 'ASSISTANCE' || channelId === 'emergency-sos') {
    return 'sos';
  }
  if (type === 'ASSISTANT' || type === 'AI_ADVISORY') {
    return 'assistant';
  }
  if (type === 'PROFILE' || type === 'ACCOUNT') {
    return 'profile';
  }
  // Default for HEATWAVE_ALERT, MORNING_BRIEFING, heat-alerts, weather-briefings
  return 'dashboard';
}

/**
 * Checks if the app was launched by tapping a push notification from killed state.
 */
export async function checkInitialNotificationResponse(): Promise<any | null> {
  try {
    const getResponse = (Notifications as any).getLastNotificationResponseAsync;
    if (typeof getResponse === 'function') {
      const response = await getResponse();
      return response;
    }
    return null;
  } catch (error) {
    console.warn('[PushNotification] Error checking initial notification response:', error);
    return null;
  }
}

// ==============================================================================
// 6. NOTIFICATION LISTENERS (FOREGROUND & USER INTERACTION)
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

  // Also check for cold-start launch via notification
  checkInitialNotificationResponse().then((initialResponse) => {
    if (initialResponse && onNotificationResponse) {
      console.log('[PushNotification] App launched from notification tap:', initialResponse?.notification?.request?.content?.title);
      onNotificationResponse(initialResponse);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
