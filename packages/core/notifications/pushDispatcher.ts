/**
 * HEATSHIELD AI — SERVER NOTIFICATION DISPATCHER (FREE EXPO PUSH API)
 * Dispatches free HTTP/2 production-grade push notifications via Expo's Push Gateway:
 * https://exp.host/--/api/v2/push/send
 * Zero per-notification cost (no paid SMS/WhatsApp), NDMA emergency compliant.
 */

export interface ExpoPushMessageOptions {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null | string;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  ttl?: number;
  badge?: number;
  subtitle?: string;
}

export interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded' | string;
    [key: string]: any;
  };
  token?: string;
}

export interface ExpoPushResponse {
  data?: ExpoPushTicket[];
  errors?: Array<{ code: string; message: string }>;
}

export interface PushDispatchResult {
  success: boolean;
  totalTokens: number;
  sent: number;
  failed: number;
  tickets: ExpoPushTicket[];
  invalidTokens: string[];
  errorCount: number;
  errors: string[];
}

export interface HeatwaveAlertParams {
  wardName: string;
  temp: number | string;
  riskLevel: 'MILD' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  slogan?: string;
  tokens?: string[];
}

export interface MorningBriefingParams {
  userId: string;
  highTemp: number | string;
  riskLevel: 'MILD' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  tip?: string;
  tokens?: string[];
}

export interface PushTokenRecord {
  id?: string;
  user_id: string;
  expo_push_token: string;
  platform?: string;
  device_name?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  last_seen_at?: string;
}

export const EXPO_PUSH_API_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
export const EXPO_MAX_BATCH_SIZE = 100; // Expo guidelines mandate chunks <= 100 messages

/**
 * Validates whether a token matches the standard Expo push token format.
 * Recognizes ExponentPushToken[...], ExpoPushToken[...], or valid alphanumeric IDs.
 */
export function isExpoPushToken(token: unknown): boolean {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (!trimmed) return false;
  return (
    /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(trimmed) ||
    /^[a-zA-Z0-9_-]{22,64}$/.test(trimmed)
  );
}

/**
 * Splits an array into chunks of a given size (default 100 for Expo limit).
 */
export function chunkArray<T>(items: T[], chunkSize: number = EXPO_MAX_BATCH_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Sends push notifications to Expo Push API using standard fetch (zero cost, zero paid SMS/WhatsApp).
 * Automatically chunks requests into batches of 100, detects invalid tokens (e.g. DeviceNotRegistered),
 * and reports delivery tickets.
 */
export async function sendExpoPushNotification(
  options: ExpoPushMessageOptions,
  fetchFn: typeof fetch = fetch
): Promise<PushDispatchResult> {
  const {
    tokens,
    title,
    body,
    data = {},
    sound = 'default',
    priority = 'high',
    channelId = 'heat-alerts',
    ttl = 86400,
    badge = 1,
    subtitle,
  } = options;

  if (!tokens || tokens.length === 0) {
    return {
      success: true,
      totalTokens: 0,
      sent: 0,
      failed: 0,
      tickets: [],
      invalidTokens: [],
      errorCount: 0,
      errors: ['No push tokens provided.'],
    };
  }

  // 1. Sanitize & deduplicate tokens
  const rawTokens = Array.from(new Set(tokens.filter((t): t is string => Boolean(t) && typeof t === 'string')));
  const validTokens: string[] = [];
  const invalidTokens: string[] = [];

  for (const token of rawTokens) {
    if (isExpoPushToken(token)) {
      validTokens.push(token);
    } else {
      invalidTokens.push(token);
    }
  }

  if (validTokens.length === 0) {
    return {
      success: false,
      totalTokens: rawTokens.length,
      sent: 0,
      failed: rawTokens.length,
      tickets: invalidTokens.map((t) => ({
        status: 'error',
        message: 'Invalid Expo push token format',
        details: { error: 'InvalidTokenFormat' },
        token: t,
      })),
      invalidTokens,
      errorCount: invalidTokens.length,
      errors: ['No valid Expo push tokens found.'],
    };
  }

  const chunks = chunkArray(validTokens, EXPO_MAX_BATCH_SIZE);
  const allTickets: ExpoPushTicket[] = [];
  const errors: string[] = [];
  let sentCount = 0;
  let failedCount = invalidTokens.length;

  for (const chunk of chunks) {
    const payload = chunk.map((token) => ({
      to: token,
      title,
      body,
      data: {
        ...data,
        receivedAt: new Date().toISOString(),
      },
      sound,
      priority,
      channelId,
      ttl,
      badge,
      ...(subtitle ? { subtitle } : {}),
      _displayInForeground: true,
    }));

    try {
      const response = await fetchFn(EXPO_PUSH_API_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        errors.push(`HTTP ${response.status}: ${errorText}`);
        for (const token of chunk) {
          failedCount++;
          allTickets.push({
            status: 'error',
            message: `HTTP ${response.status}: ${errorText}`,
            token,
          });
        }
        continue;
      }

      const resData = (await response.json()) as ExpoPushResponse;

      if (resData.errors && resData.errors.length > 0) {
        for (const err of resData.errors) {
          errors.push(`${err.code}: ${err.message}`);
        }
      }

      if (resData.data) {
        resData.data.forEach((ticket, idx) => {
          const associatedToken = chunk[idx];
          const enrichedTicket: ExpoPushTicket = {
            ...ticket,
            token: associatedToken,
          };
          allTickets.push(enrichedTicket);

          if (ticket.status === 'ok') {
            sentCount++;
          } else {
            failedCount++;
            if (ticket.message) {
              errors.push(ticket.message);
            }
            if (ticket.details?.error === 'DeviceNotRegistered') {
              invalidTokens.push(associatedToken);
            }
          }
        });
      }
    } catch (err: any) {
      const msg = `Network error dispatching push batch: ${err.message || String(err)}`;
      errors.push(msg);
      for (const token of chunk) {
        failedCount++;
        allTickets.push({
          status: 'error',
          message: msg,
          token,
        });
      }
    }
  }

  return {
    success: sentCount > 0 || (validTokens.length === 0 && failedCount === 0),
    totalTokens: rawTokens.length,
    sent: sentCount,
    failed: failedCount,
    tickets: allTickets,
    invalidTokens: Array.from(new Set(invalidTokens)),
    errorCount: failedCount,
    errors,
  };
}

/**
 * Broadcasts an immediate Heatwave Alert to all residents in an affected ward.
 * Fetches all active push tokens for residents in the affected ward and sends immediate emergency push notification.
 */
export async function broadcastHeatwaveAlert(
  params: HeatwaveAlertParams,
  options?: {
    getTokensForWard?: (wardName: string) => Promise<string[]>;
    onDeactivateTokens?: (tokens: string[]) => Promise<void>;
    fetchFn?: typeof fetch;
  }
): Promise<{
  wardName: string;
  temp: number | string;
  riskLevel: string;
  dispatched: number;
  result: PushDispatchResult;
}> {
  const { wardName, temp, riskLevel, slogan, tokens: providedTokens } = params;
  const normalizedRisk = String(riskLevel || 'HIGH').toUpperCase();

  let alertHeader = '🌡️ HEAT ADVISORY';
  let defaultSlogan = 'Drink water frequently and seek shade during peak sunlight.';

  if (normalizedRisk === 'CRITICAL') {
    alertHeader = '🚨 CRITICAL HEATWAVE EMERGENCY';
    defaultSlogan = 'NDMA Red Alert: Life safety risk. Remain indoors & check cooling centres.';
  } else if (normalizedRisk === 'HIGH') {
    alertHeader = '⚠️ SEVERE HEAT WARNING';
    defaultSlogan = 'NDMA Orange Alert: High temperature peak. Restrict afternoon movement.';
  } else if (normalizedRisk === 'MODERATE') {
    alertHeader = '☀️ ELEVATED HEAT ADVISORY';
    defaultSlogan = 'Hydrate frequently. Wear light cotton clothing and carry water.';
  }

  const title = `${alertHeader} — ${wardName}`;
  const resolvedSlogan = slogan || defaultSlogan;
  const body = `Current Temp: ${temp}°C in ${wardName}. ${resolvedSlogan}`;

  // Retrieve tokens for this ward
  let targetTokens: string[] = providedTokens || [];
  if (targetTokens.length === 0 && options?.getTokensForWard) {
    targetTokens = await options.getTokensForWard(wardName);
  }

  const result = await sendExpoPushNotification(
    {
      tokens: targetTokens,
      title,
      body,
      data: {
        type: 'HEATWAVE_ALERT',
        wardName,
        temp,
        riskLevel: normalizedRisk,
        slogan: resolvedSlogan,
        channelId: 'heat-alerts',
        priority: 'high',
        timestamp: new Date().toISOString(),
      },
      sound: 'default',
      priority: 'high',
      channelId: 'heat-alerts',
    },
    options?.fetchFn
  );

  // Auto-deactivate stale/unregistered tokens
  if (result.invalidTokens.length > 0 && options?.onDeactivateTokens) {
    try {
      await options.onDeactivateTokens(result.invalidTokens);
    } catch (err) {
      console.warn('[PushDispatcher] Failed to deactivate invalid tokens:', err);
    }
  }

  return {
    wardName,
    temp,
    riskLevel: normalizedRisk,
    dispatched: result.sent,
    result,
  };
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
): Promise<{
  userId: string;
  highTemp: number | string;
  riskLevel: string;
  dispatched: number;
  result: PushDispatchResult;
}> {
  const { userId, highTemp, riskLevel, tip, tokens: providedTokens } = params;
  const normalizedRisk = String(riskLevel || 'MODERATE').toUpperCase();

  const defaultTip = Number(highTemp) >= 40
    ? 'Peak afternoon heat expected. Hydrate hourly, take shade breaks, and keep ORS ready.'
    : 'Moderate heat expected. Carry water when travelling outdoors.';

  const title = '☀️ Morning Heat Briefing';
  const body = `Today's high: ${highTemp}°C (${normalizedRisk} risk). ${tip || defaultTip}`;

  let targetTokens: string[] = providedTokens || [];
  if (targetTokens.length === 0 && options?.getTokensForUser) {
    targetTokens = await options.getTokensForUser(userId);
  }

  const isHighRisk = ['CRITICAL', 'HIGH', 'EXTREME'].includes(normalizedRisk);

  const result = await sendExpoPushNotification(
    {
      tokens: targetTokens,
      title,
      body,
      data: {
        type: 'MORNING_BRIEFING',
        userId,
        highTemp,
        riskLevel: normalizedRisk,
        tip: tip || defaultTip,
        channelId: 'weather-briefings',
        priority: isHighRisk ? 'high' : 'normal',
        timestamp: new Date().toISOString(),
      },
      sound: 'default',
      priority: isHighRisk ? 'high' : 'normal',
      channelId: 'weather-briefings',
    },
    options?.fetchFn
  );

  // Auto-deactivate stale/unregistered tokens
  if (result.invalidTokens.length > 0 && options?.onDeactivateTokens) {
    try {
      await options.onDeactivateTokens(result.invalidTokens);
    } catch (err) {
      console.warn('[PushDispatcher] Failed to deactivate invalid tokens:', err);
    }
  }

  return {
    userId,
    highTemp,
    riskLevel: normalizedRisk,
    dispatched: result.sent,
    result,
  };
}

/**
 * Backwards-compatibility alias for sendExpoPushNotification
 */
export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<PushDispatchResult> {
  return sendExpoPushNotification({
    tokens,
    title,
    body,
    data,
    sound: 'default',
    priority: data?.priority || 'high',
    channelId: data?.channelId || 'heat-alerts',
  });
}

/**
 * Backwards-compatibility alias for broadcastHeatwaveAlert
 */
export async function sendHeatwaveAlertPush(
  params: HeatwaveAlertParams
): Promise<PushDispatchResult> {
  const { result } = await broadcastHeatwaveAlert(params);
  return result;
}
