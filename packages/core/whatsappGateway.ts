/**
 * HEATSHIELD AI — WhatsApp Gateway Client
 * ----------------------------------------
 * Talks to the Baileys-powered WhatsApp notification gateway.
 * Supports emergency alerts, user notification opt-in, daily briefings,
 * and live delivery logs.
 */

const GATEWAY_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_GATEWAY_URL) ||
  (typeof process !== 'undefined' && (process.env?.VITE_WHATSAPP_GATEWAY_URL || process.env?.WHATSAPP_GATEWAY_URL)) ||
  'http://localhost:3100'
).replace(/\/$/, '');

const API_SECRET =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_API_SECRET) ||
  (typeof process !== 'undefined' && (process.env?.VITE_WHATSAPP_API_SECRET || process.env?.WHATSAPP_API_SECRET)) ||
  '';

export type WAStatus = 'connecting' | 'qr_ready' | 'connected' | 'logged_out' | 'unreachable';

export interface WAContact {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  locality: string;
  verified?: boolean;
  optedIn?: boolean;
  preferences?: {
    dailyBriefing: boolean;
    extremeHeatAlerts: boolean;
    severeWeatherAlerts: boolean;
  };
  addedAt: string;
}

export interface WADeliveryLog {
  type: 'single' | 'broadcast' | 'daily_briefing';
  idempotencyKey?: string;
  to?: string;
  locality?: string;
  count?: number;
  message?: string;
  result?: { success?: boolean; error?: string; messageId?: string };
  timestamp: string;
}

export interface WABroadcastResult {
  phone: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface GatewayHealthResult {
  reachable: boolean;
  status: WAStatus;
  connected: boolean;
  message: string;
}

export interface WhatsAppOptInPayload {
  phone: string;
  countryCode?: string;
  name?: string;
  locality?: string;
  userId?: string;
  preferences: {
    dailyBriefing: boolean;
    extremeHeatAlerts: boolean;
    severeWeatherAlerts: boolean;
  };
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-secret': API_SECRET,
  };
}

/**
 * Returns true if the WhatsApp gateway is reachable, along with connection status
 */
export async function checkGatewayHealth(): Promise<GatewayHealthResult> {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    return {
      reachable: true,
      status: (data.whatsapp || 'connecting') as WAStatus,
      connected: Boolean(data.connected),
      message: data.message || (data.connected ? 'Connected' : 'WhatsApp gateway not linked')
    };
  } catch {
    return {
      reachable: false,
      status: 'unreachable',
      connected: false,
      message: 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI'
    };
  }
}

/** Polls the QR code endpoint. Returns base64 PNG or null if already connected. */
export async function fetchQRCode(): Promise<{ status: WAStatus; qr: string | null; message?: string }> {
  try {
    const res = await fetch(`${GATEWAY_URL}/qr`);
    const data = await res.json();
    return {
      status: data.status as WAStatus,
      qr: data.qr,
      message: data.message
    };
  } catch {
    return { status: 'unreachable', qr: null, message: 'Gateway offline' };
  }
}

/** Returns the current WhatsApp connection status */
export async function fetchStatus(): Promise<WAStatus> {
  try {
    const res = await fetch(`${GATEWAY_URL}/status`);
    const data = await res.json();
    return data.status as WAStatus;
  } catch {
    return 'unreachable';
  }
}

// ─── WhatsApp User Opt-In & Preferences ───────────────────────────────────────

/**
 * Registers or updates a resident's explicit WhatsApp consent & notification preferences
 */
export async function saveWhatsAppOptIn(payload: WhatsAppOptInPayload): Promise<{
  success: boolean;
  message: string;
  contact?: WAContact;
  gatewayConnected?: boolean;
}> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/opt-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to record WhatsApp opt-in. Please ensure gateway service is reachable.'
    };
  }
}

/**
 * Fetches user's current WhatsApp opt-in state and preferences
 */
export async function fetchWhatsAppOptIn(phone: string, countryCode = '+91'): Promise<{
  optedIn: boolean;
  verified: boolean;
  preferences: { dailyBriefing: boolean; extremeHeatAlerts: boolean; severeWeatherAlerts: boolean };
  contact?: WAContact;
}> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/opt-in/${encodeURIComponent(phone)}?countryCode=${encodeURIComponent(countryCode)}`);
    return await res.json();
  } catch {
    return {
      optedIn: false,
      verified: false,
      preferences: { dailyBriefing: true, extremeHeatAlerts: true, severeWeatherAlerts: true }
    };
  }
}

// ─── Daily 6:00 AM Weather Briefing Trigger ───────────────────────────────────

/**
 * Triggers the 6:00 AM Daily Weather Briefing job across all opted-in residents
 */
export async function triggerDailyBriefing(forceImmediate = false): Promise<{
  success: boolean;
  totalEligible: number;
  sent: number;
  skipped: number;
  failed: number;
  results?: any[];
  error?: string;
}> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/cron/daily-briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceImmediate }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      totalEligible: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      error: err.message
    };
  }
}

// ─── Admin Messaging Endpoints ────────────────────────────────────────────────

/** Send a WhatsApp message to a single phone number */
export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const res = await fetch(`${GATEWAY_URL}/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ to, message }),
  });
  return res.json();
}

/** Broadcast a message to multiple phone numbers */
export async function broadcastWhatsApp(
  contacts: string[],
  message: string,
  delayMs = 1500
): Promise<{ success: boolean; total: number; results: WABroadcastResult[] }> {
  const res = await fetch(`${GATEWAY_URL}/broadcast`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ contacts, message, delayMs }),
  });
  return res.json();
}

/** Fetch all registered contacts */
export async function fetchContacts(): Promise<WAContact[]> {
  const res = await fetch(`${GATEWAY_URL}/contacts`);
  return res.json();
}

/** Add a contact to the WhatsApp gateway */
export async function addContact(contact: Omit<WAContact, 'id' | 'addedAt'>): Promise<WAContact> {
  const res = await fetch(`${GATEWAY_URL}/contacts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(contact),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add contact');
  }
  return res.json();
}

/** Remove a contact from the gateway */
export async function removeContact(phone: string): Promise<void> {
  await fetch(`${GATEWAY_URL}/contacts/${phone}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/** Fetch delivery logs */
export async function fetchDeliveryLogs(): Promise<WADeliveryLog[]> {
  const res = await fetch(`${GATEWAY_URL}/logs`);
  return res.json();
}

/** Disconnect / logout from WhatsApp */
export async function disconnectWhatsApp(): Promise<void> {
  await fetch(`${GATEWAY_URL}/disconnect`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

// ─── Strictly Branded Notification Message Formatters ─────────────────────────

export function formatHeatAlertMessage(params: {
  residentName: string;
  locality: string;
  tempC: number;
  feelsLikeC: number;
  riskCategory: string;
  riskScore: number;
  advice: string;
}): string {
  const { residentName, locality, tempC, feelsLikeC, riskCategory, riskScore, advice } = params;
  const emoji = riskCategory === 'critical' ? '🔴' : riskCategory === 'high' ? '🟠' : riskCategory === 'moderate' ? '🟡' : '🟢';

  return `${emoji} *HeatShield AI — Heat Alert*

Hello ${residentName} 👋

📍 *${locality}*
🌡️ Temperature: *${tempC}°C* (Feels like ${feelsLikeC}°C)
⚠️ Heat Risk: *${riskCategory.toUpperCase()}* (${riskScore}/100)

💡 *Safety Advice:*
${advice}

Need help or cooling centres?
🔗 https://heatshield-ai-eight.vercel.app/dashboard

—HeatShield AI · Predict. Protect. Prevent.`;
}

export function formatEmergencyAlertMessage(params: {
  locality: string;
  headline: string;
  description: string;
}): string {
  return `🚨 *EMERGENCY HEAT ALERT — HeatShield AI*

📍 *${params.locality}*
*${params.headline}*

${params.description}

🆘 Emergency: Dial *108* or *112* immediately
💧 Find cooling centres: https://heatshield-ai-eight.vercel.app/cooling-centres

Stay safe. Stay hydrated. Stay indoors.
—HeatShield AI Emergency Coordination`;
}

export function formatWelcomeMessage(params: { name: string; locality: string }): string {
  return `✅ *Welcome to HeatShield AI!*

Hi ${params.name}, you're now registered for HeatShield AI WhatsApp alerts for *${params.locality}*.

You'll receive:
• ☀️ Daily Morning Briefing (6:00 AM)
• 🌡️ Real-time heat risk updates
• 🚨 Critical heatwave emergency alerts
• 💡 Personalized safety advice

Stay cool! 🧊
—HeatShield AI Team`;
}

export function formatDailyBriefingMessage(params: {
  locality: string;
  temp: number;
  peakTemp: number;
  riskLevel: string;
  humidity: number;
  rainChance: number;
  peakHours?: string;
  safetyAdvice: string;
}): string {
  return `☀️ GOOD MORNING — HEATSHIELD AI
Today's Heat Report
📍 Your area: ${params.locality}
🌡 Temperature: ${params.temp}°C (Peak: ${params.peakTemp}°C)
🔥 Heat Risk: ${params.riskLevel}
💧 Humidity: ${params.humidity}%
🌧 Rain chance: ${params.rainChance}%
⏰ Peak heat: ${params.peakHours || '12:00 PM – 4:00 PM'}
💡 Recommendation: ${params.safetyAdvice}`;
}
