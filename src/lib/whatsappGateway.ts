/**
 * HEATSHIELD AI — WhatsApp Gateway Client
 * ----------------------------------------
 * Talks to the local Baileys-powered WhatsApp gateway service.
 * Configure VITE_WHATSAPP_GATEWAY_URL and VITE_WHATSAPP_API_SECRET in .env.local
 */

const GATEWAY_URL = (import.meta.env.VITE_WHATSAPP_GATEWAY_URL || 'http://localhost:3100').replace(/\/$/, '');
const API_SECRET  = import.meta.env.VITE_WHATSAPP_API_SECRET || '';

export type WAStatus = 'connecting' | 'qr_ready' | 'connected' | 'logged_out' | 'unreachable';

export interface WAContact {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  locality: string;
  addedAt: string;
}

export interface WADeliveryLog {
  type: 'single' | 'broadcast';
  to?: string;
  count?: number;
  message: string;
  result?: { success?: boolean; error?: string; messageId?: string };
  timestamp: string;
}

export interface WABroadcastResult {
  phone: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-secret': API_SECRET,
  };
}

/** Returns true if the WhatsApp gateway is reachable */
export async function checkGatewayHealth(): Promise<{ reachable: boolean; status: WAStatus }> {
  try {
    const res = await fetch(`${GATEWAY_URL}/health`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    return { reachable: true, status: data.whatsapp as WAStatus };
  } catch {
    return { reachable: false, status: 'unreachable' };
  }
}

/** Polls the QR code endpoint. Returns base64 PNG or null if already connected. */
export async function fetchQRCode(): Promise<{ status: WAStatus; qr: string | null }> {
  const res = await fetch(`${GATEWAY_URL}/qr`);
  const data = await res.json();
  return { status: data.status as WAStatus, qr: data.qr };
}

/** Returns the current WhatsApp connection status */
export async function fetchStatus(): Promise<WAStatus> {
  const res = await fetch(`${GATEWAY_URL}/status`);
  const data = await res.json();
  return data.status as WAStatus;
}

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

// ─── Notification message formatters ──────────────────────────────────────────

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

Need help? Request assistance at:
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

Stay safe. Stay hydrated. Stay indoors.`;
}

export function formatWelcomeMessage(params: { name: string; locality: string }): string {
  return `✅ *Welcome to HeatShield AI!*

Hi ${params.name}, you're now registered for WhatsApp heat alerts for *${params.locality}*.

You'll receive:
• 🌡️ Hourly heat risk updates
• 🚨 Critical heatwave emergency alerts
• 💡 Personalised safety advice

Stay cool! 🧊
—HeatShield AI Team`;
}
