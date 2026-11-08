// Supabase Edge Function: send-push-notification
// High-throughput, zero-cost push notification dispatcher via Expo Push API
// Follows NDMA guidelines, performs token sanitation & invalid token deactivation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_MAX_CHUNK_SIZE = 100;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushRequestBody {
  action?: 'broadcast_ward' | 'morning_briefing' | 'send_direct' | 'send';
  // Common push parameters
  tokens?: string[];
  userId?: string;
  userIds?: string[];
  wardName?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null | string;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  // Specific action parameters
  temp?: number | string;
  highTemp?: number | string;
  riskLevel?: string;
  slogan?: string;
  tip?: string;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
    [key: string]: unknown;
  };
}

function isExpoPushToken(token: unknown): boolean {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (!trimmed) return false;
  return (
    /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(trimmed) ||
    /^[a-zA-Z0-9_-]{22,64}$/.test(trimmed)
  );
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate Authorization Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 3. Parse Request Payload
    const payload: PushRequestBody = await req.json();
    const action = payload.action || (payload.wardName ? 'broadcast_ward' : (payload.userId ? 'morning_briefing' : 'send_direct'));

    let targetTokens: string[] = payload.tokens || [];
    let messageTitle = payload.title || 'HeatShield Alert';
    let messageBody = payload.body || '';
    let messageData: Record<string, unknown> = payload.data || {};
    let messagePriority: 'default' | 'normal' | 'high' = payload.priority || 'high';
    let channelId = payload.channelId || 'heat-alerts';

    // 4. Resolve Target Tokens & Content based on Action
    if (action === 'broadcast_ward') {
      const ward = payload.wardName || 'General Area';
      const temp = payload.temp ?? 42;
      const risk = String(payload.riskLevel || 'HIGH').toUpperCase();
      const slogan = payload.slogan || 'Stay hydrated and seek shade during peak sunlight.';

      messageTitle = `🚨 NDMA Heatwave Alert: ${ward}`;
      messageBody = `Current Temp: ${temp}°C in ${ward} (${risk} RISK). ${slogan}`;
      messagePriority = 'high';
      channelId = 'heat-emergency-alerts';
      messageData = {
        type: 'HEATWAVE_ALERT',
        wardName: ward,
        temp,
        riskLevel: risk,
        slogan,
        ...messageData,
      };

      // Query database for resident push tokens in this ward
      if (targetTokens.length === 0) {
        if (ward.toLowerCase() === 'all' || ward === '*') {
          const { data: allTokens, error: allErr } = await supabase
            .from('push_tokens')
            .select('expo_push_token')
            .eq('enabled', true);
          if (!allErr && allTokens) {
            targetTokens = allTokens.map((t: { expo_push_token: string }) => t.expo_push_token);
          }
        } else {
          // Find matching profiles by locality name
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .ilike('primary_locality_name', `%${ward}%`);

          if (profiles && profiles.length > 0) {
            const userIds = profiles.map((p: { id: string }) => p.id);
            const { data: wardTokens } = await supabase
              .from('push_tokens')
              .select('expo_push_token')
              .in('user_id', userIds)
              .eq('enabled', true);

            if (wardTokens && wardTokens.length > 0) {
              targetTokens = wardTokens.map((t: { expo_push_token: string }) => t.expo_push_token);
            }
          }

          // Fallback: if no specific user profile matched, target all active enabled tokens in system
          if (targetTokens.length === 0) {
            const { data: broadTokens } = await supabase
              .from('push_tokens')
              .select('expo_push_token')
              .eq('enabled', true)
              .limit(500);
            if (broadTokens) {
              targetTokens = broadTokens.map((t: { expo_push_token: string }) => t.expo_push_token);
            }
          }
        }
      }
    } else if (action === 'morning_briefing') {
      const highTemp = payload.highTemp ?? 40;
      const risk = String(payload.riskLevel || 'MODERATE').toUpperCase();
      const tip = payload.tip || 'Plan outdoor activities early, avoid direct sun between 12-4 PM, and hydrate frequently.';

      messageTitle = '☀️ Morning Heat Briefing';
      messageBody = `Today's high: ${highTemp}°C (${risk} risk). ${tip}`;
      messagePriority = ['CRITICAL', 'HIGH'].includes(risk) ? 'high' : 'normal';
      channelId = 'morning-briefings';
      messageData = {
        type: 'MORNING_BRIEFING',
        userId: payload.userId,
        highTemp,
        riskLevel: risk,
        ...messageData,
      };

      if (payload.userId && targetTokens.length === 0) {
        const { data: userTokens } = await supabase
          .from('push_tokens')
          .select('expo_push_token')
          .eq('user_id', payload.userId)
          .eq('enabled', true);

        if (userTokens) {
          targetTokens = userTokens.map((t: { expo_push_token: string }) => t.expo_push_token);
        }
      }
    } else if (payload.userIds && payload.userIds.length > 0) {
      const { data: targetedTokens } = await supabase
        .from('push_tokens')
        .select('expo_push_token')
        .in('user_id', payload.userIds)
        .eq('enabled', true);

      if (targetedTokens) {
        targetTokens = targetedTokens.map((t: { expo_push_token: string }) => t.expo_push_token);
      }
    }

    // 5. Sanitize and Deduplicate Tokens
    const rawTokens = Array.from(new Set(targetTokens.filter(Boolean)));
    const validTokens = rawTokens.filter(isExpoPushToken);

    if (validTokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active or valid push tokens found for dispatch target.',
          totalTokens: rawTokens.length,
          sent: 0,
          failed: rawTokens.length,
          tickets: [],
          deactivatedTokens: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Batch Requests into Chunks of <= 100 for Expo Push API
    const chunks = chunkArray(validTokens, EXPO_MAX_CHUNK_SIZE);
    const tickets: Array<ExpoTicket & { token: string }> = [];
    const invalidTokensToDeactivate: string[] = [];
    let sentCount = 0;
    let failedCount = 0;

    const expoHeaders: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    };

    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    if (expoAccessToken) {
      expoHeaders['Authorization'] = `Bearer ${expoAccessToken}`;
    }

    for (const chunk of chunks) {
      const messages = chunk.map((token) => ({
        to: token,
        title: messageTitle,
        body: messageBody,
        data: {
          ...messageData,
          dispatchedAt: new Date().toISOString(),
        },
        sound: payload.sound || 'default',
        priority: messagePriority,
        channelId,
        _displayInForeground: true,
      }));

      try {
        const expoRes = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: expoHeaders,
          body: JSON.stringify(messages),
        });

        if (!expoRes.ok) {
          const errText = await expoRes.text();
          for (const token of chunk) {
            failedCount++;
            tickets.push({
              status: 'error',
              message: `Expo Push HTTP ${expoRes.status}: ${errText}`,
              token,
            });
          }
          continue;
        }

        const expoData = await expoRes.json() as { data?: ExpoTicket[] };
        const results = expoData.data || [];

        results.forEach((ticket, idx) => {
          const associatedToken = chunk[idx];
          tickets.push({
            ...ticket,
            token: associatedToken,
          });

          if (ticket.status === 'ok') {
            sentCount++;
          } else {
            failedCount++;
            if (ticket.details?.error === 'DeviceNotRegistered') {
              invalidTokensToDeactivate.push(associatedToken);
            }
          }
        });
      } catch (networkErr: unknown) {
        const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
        for (const token of chunk) {
          failedCount++;
          tickets.push({
            status: 'error',
            message: `Dispatch network error: ${msg}`,
            token,
          });
        }
      }
    }

    // 7. Deactivate Invalid Tokens (DeviceNotRegistered) in Database
    if (invalidTokensToDeactivate.length > 0) {
      try {
        await supabase
          .from('push_tokens')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .in('expo_push_token', invalidTokensToDeactivate);
      } catch (deactErr) {
        console.error('[EdgeFunction] Token deactivation error:', deactErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: sentCount > 0 || (validTokens.length === 0 && failedCount === 0),
        totalTokens: validTokens.length,
        sent: sentCount,
        failed: failedCount,
        deactivatedTokens: invalidTokensToDeactivate,
        tickets,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
