/**
 * HEATSHIELD AI — PUSH NOTIFICATION DISPATCHER (CLIENT & BACKEND INTEGRATION)
 * Full Supabase integration for Android Expo Push Notifications.
 * Zero-cost emergency dispatch, NDMA compliant, token health lifecycle management.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  ExpoPushMessageOptions,
  ExpoPushTicket,
  PushDispatchResult,
  HeatwaveAlertParams,
  MorningBriefingParams,
  PushTokenRecord,
  isExpoPushToken,
  sendExpoPushNotification as coreSendExpoPushNotification,
  broadcastHeatwaveAlert as coreBroadcastHeatwaveAlert,
  sendMorningBriefingPush as coreSendMorningBriefingPush,
  sendPushNotification,
  sendHeatwaveAlertPush,
} from '../../packages/core/notifications/pushDispatcher';

export type {
  ExpoPushMessageOptions,
  ExpoPushTicket,
  PushDispatchResult,
  HeatwaveAlertParams,
  MorningBriefingParams,
  PushTokenRecord,
};

export {
  isExpoPushToken,
  sendPushNotification,
  sendHeatwaveAlertPush,
};

// Local storage fallback key for offline / mock testing
const LOCAL_PUSH_TOKENS_KEY = 'heatshield_push_tokens';

/**
 * Retrieves push tokens stored in local fallback storage
 */
function getLocalFallbackTokens(): PushTokenRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_PUSH_TOKENS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves push tokens to local fallback storage
 */
function saveLocalFallbackTokens(tokens: PushTokenRecord[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_PUSH_TOKENS_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.warn('[PushDispatcher] Failed to write local fallback tokens:', err);
  }
}

/**
 * Registers an Expo push token for an authenticated user.
 * Upserts token in Supabase `push_tokens` table with strict conflict handling.
 */
export async function registerPushToken(params: {
  userId: string;
  token: string;
  platform?: string;
  deviceName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { userId, token, platform = 'android', deviceName } = params;

  if (!isExpoPushToken(token)) {
    return { success: false, error: 'Invalid Expo push token format' };
  }

  const nowIso = new Date().toISOString();

  // 1. If Supabase is configured, upsert into push_tokens table
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            expo_push_token: token,
            platform,
            device_name: deviceName || (platform === 'android' ? 'Android Device' : 'Mobile Device'),
            enabled: true,
            updated_at: nowIso,
            last_seen_at: nowIso,
          },
          { onConflict: 'expo_push_token' }
        );

      if (error) {
        console.warn('[PushDispatcher] Supabase token registration warning:', error.message);
      } else {
        return { success: true };
      }
    } catch (err: any) {
      console.warn('[PushDispatcher] Supabase token register error:', err.message);
    }
  }

  // 2. Resilient local fallback store
  try {
    const existing = getLocalFallbackTokens();
    const filtered = existing.filter((t) => t.expo_push_token !== token);
    filtered.push({
      id: `local-${Date.now()}`,
      user_id: userId,
      expo_push_token: token,
      platform,
      device_name: deviceName || 'Android Device',
      enabled: true,
      created_at: nowIso,
      updated_at: nowIso,
      last_seen_at: nowIso,
    });
    saveLocalFallbackTokens(filtered);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all active push tokens for residents registered in a given ward/locality.
 */
export async function fetchTokensForWard(wardName: string): Promise<string[]> {
  const activeTokens: string[] = [];

  // 1. Try Supabase live query
  if (isSupabaseConfigured && supabase) {
    try {
      const isBroad = !wardName || wardName.toLowerCase() === 'all' || wardName.trim() === '*';

      if (isBroad) {
        const { data, error } = await supabase
          .from('push_tokens')
          .select('expo_push_token')
          .eq('enabled', true);

        if (!error && data) {
          return data.map((row: { expo_push_token: string }) => row.expo_push_token);
        }
      } else {
        // Query profiles matching wardName
        const { data: profiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id')
          .or(`primary_locality_name.ilike.%${wardName.trim()}%,full_name.ilike.%${wardName.trim()}%`);

        if (!profileErr && profiles && profiles.length > 0) {
          const userIds = profiles.map((p: { id: string }) => p.id);
          const { data: tokens, error: tokenErr } = await supabase
            .from('push_tokens')
            .select('expo_push_token')
            .in('user_id', userIds)
            .eq('enabled', true);

          if (!tokenErr && tokens) {
            tokens.forEach((t: { expo_push_token: string }) => activeTokens.push(t.expo_push_token));
          }
        }

        // If ward didn't match profiles directly, try location join or broad fallback if no specific user matched
        if (activeTokens.length === 0) {
          const { data: allActive } = await supabase
            .from('push_tokens')
            .select('expo_push_token')
            .eq('enabled', true)
            .limit(500);

          if (allActive) {
            allActive.forEach((t: { expo_push_token: string }) => activeTokens.push(t.expo_push_token));
          }
        }
      }
    } catch (err) {
      console.warn('[PushDispatcher] Supabase ward token lookup error:', err);
    }
  }

  // 2. Resilient local fallback store
  if (activeTokens.length === 0) {
    const localTokens = getLocalFallbackTokens();
    const enabled = localTokens.filter((t) => t.enabled !== false).map((t) => t.expo_push_token);
    activeTokens.push(...enabled);
  }

  return Array.from(new Set(activeTokens.filter(isExpoPushToken)));
}

/**
 * Fetches all active push tokens belonging to a specific user.
 */
export async function fetchTokensForUser(userId: string): Promise<string[]> {
  const activeTokens: string[] = [];

  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('expo_push_token')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (!error && data) {
        data.forEach((row: { expo_push_token: string }) => activeTokens.push(row.expo_push_token));
      }
    } catch (err) {
      console.warn('[PushDispatcher] Supabase user token lookup error:', err);
    }
  }

  // 2. Resilient local fallback
  if (activeTokens.length === 0) {
    const localTokens = getLocalFallbackTokens();
    const matched = localTokens
      .filter((t) => t.user_id === userId && t.enabled !== false)
      .map((t) => t.expo_push_token);
    activeTokens.push(...matched);
  }

  return Array.from(new Set(activeTokens.filter(isExpoPushToken)));
}

/**
 * Deactivates invalid tokens (such as DeviceNotRegistered) in the database.
 */
export async function deactivateInvalidTokens(tokens: string[]): Promise<void> {
  if (!tokens || tokens.length === 0) return;

  // 1. Supabase deactivation
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .in('expo_push_token', tokens);

      if (error) {
        console.warn('[PushDispatcher] Failed to update invalid tokens in Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[PushDispatcher] Supabase deactivation exception:', err);
    }
  }

  // 2. Local fallback update
  try {
    const current = getLocalFallbackTokens();
    let updated = false;
    for (const item of current) {
      if (tokens.includes(item.expo_push_token)) {
        item.enabled = false;
        item.updated_at = new Date().toISOString();
        updated = true;
      }
    }
    if (updated) {
      saveLocalFallbackTokens(current);
    }
  } catch (err) {
    console.warn('[PushDispatcher] Local fallback token deactivation error:', err);
  }
}

/**
 * Sends push notifications to Expo Push API using standard fetch (zero cost, zero paid SMS/WhatsApp).
 */
export async function sendExpoPushNotification(
  options: ExpoPushMessageOptions,
  fetchFn: typeof fetch = fetch
): Promise<PushDispatchResult> {
  return coreSendExpoPushNotification(options, fetchFn);
}

/**
 * Broadcasts an immediate emergency Heatwave Alert to all residents in an affected ward.
 * Fetches all active push tokens for residents in the affected ward and sends immediate emergency push notification.
 */
export async function broadcastHeatwaveAlert(
  params: HeatwaveAlertParams,
  options?: {
    getTokensForWard?: (wardName: string) => Promise<string[]>;
    onDeactivateTokens?: (tokens: string[]) => Promise<void>;
    fetchFn?: typeof fetch;
  }
) {
  return coreBroadcastHeatwaveAlert(params, {
    getTokensForWard: options?.getTokensForWard || fetchTokensForWard,
    onDeactivateTokens: options?.onDeactivateTokens || deactivateInvalidTokens,
    fetchFn: options?.fetchFn,
  });
}

/**
 * Sends a daily morning heat briefing push notification to a specific resident.
 */
export async function sendMorningBriefingPush(
  params: MorningBriefingParams,
  options?: {
    getTokensForUser?: (userId: string) => Promise<string[]>;
    onDeactivateTokens?: (tokens: string[]) => Promise<void>;
    fetchFn?: typeof fetch;
  }
) {
  return coreSendMorningBriefingPush(params, {
    getTokensForUser: options?.getTokensForUser || fetchTokensForUser,
    onDeactivateTokens: options?.onDeactivateTokens || deactivateInvalidTokens,
    fetchFn: options?.fetchFn,
  });
}
