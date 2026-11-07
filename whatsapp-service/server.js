/**
 * HEATSHIELD AI — WhatsApp Notification Gateway & OTP Service
 * -------------------------------------------------------------
 * Uses @whiskeysockets/baileys (open-source WhatsApp Web API client) to link
 * YOUR WhatsApp number (via QR code scan) and send verified heat alerts,
 * cryptographic phone OTPs, and 6:00 AM daily weather briefings to residents.
 *
 * Sender Identity: HeatShield AI
 *
 * Endpoints:
 *  GET  /health                    → service status + WA connection state
 *  GET  /status                    → connected / connecting / qr_ready / logged_out
 *  GET  /qr                        → returns QR code as base64 PNG
 *  POST /api/otp/request           → request 6-digit OTP via WhatsApp/Dev
 *  POST /api/otp/verify            → verify 6-digit OTP + return verification token
 *  POST /api/opt-in                → register/update resident WhatsApp consent & preferences
 *  GET  /api/opt-in/:phone         → get resident consent & notification preferences
 *  POST /api/cron/daily-briefing   → execute 6:00 AM daily weather briefing (idempotent)
 *  GET  /api/cron/daily-briefing   → check/trigger daily briefing
 *  POST /send                      → send single message (authenticated)
 *  POST /broadcast                 → broadcast message to multiple phones (authenticated)
 *  GET  /contacts                  → list registered contacts
 *  POST /contacts                  → add contact (authenticated)
 *  DELETE /contacts/:phone         → remove contact (authenticated)
 *  GET  /logs                      → delivery log (last 500)
 *  POST /disconnect                → logout from WhatsApp (authenticated)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';

// ─── Config ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3100', 10);
const HOST = process.env.HOST || '0.0.0.0';
const API_SECRET = process.env.API_SECRET || '15906433186ebb63ec0326ca181f40a31f2d84b6dd42f14bf7529b6ef30c0da4';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const SESSION_DIR = path.resolve(__dirname, process.env.SESSION_DIR || './sessions');
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const CONTACTS_FILE = path.resolve(__dirname, 'contacts.json');
const LOG_FILE = path.resolve(__dirname, 'sent-log.json');

// ─── Logger ───────────────────────────────────────────────────────────────────
const logger = pino(
  { level: 'info' },
  pino.transport({ target: 'pino-pretty', options: { colorize: true } })
);

// ─── State ────────────────────────────────────────────────────────────────────
let currentQR = null;               // base64 QR image string
let connectionStatus = 'connecting'; // 'connecting' | 'connected' | 'logged_out' | 'qr_ready'
let sock = null;                    // Baileys socket
let reconnectTimer = null;

// ─── In-Memory OTP Store & Rate Limiter ─────────────────────────────────────────
/**
 * canonicalPhone -> {
 *   hash: string,
 *   rawOtp?: string, // retained for test/dev logs
 *   expiresAt: number,
 *   attemptsRemaining: number,
 *   resendCooldownUntil: number,
 *   requestTimestamps: number[],
 *   countryCode: string
 * }
 */
const activeOtps = new Map();

function hashOtp(otp, phone) {
  return crypto.createHash('sha256').update(`${phone}:${otp}:heatshield-ai-salt`).digest('hex');
}

// ─── File helpers ─────────────────────────────────────────────────────────────
function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
  }
}

function readJson(filePath, defaultValue = []) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

ensureFile(CONTACTS_FILE, []);
ensureFile(LOG_FILE, []);
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// ─── Phone & Contact Helpers ──────────────────────────────────────────────────
/**
 * Normalizes phone numbers to standard E.164 digits without '+' (e.g. 919876543210)
 */
function normalizeE164(phone, countryCode = '+91') {
  let clean = String(phone || '').replace(/\D/g, '');
  const cleanCode = String(countryCode || '+91').replace(/\D/g, '') || '91';

  // Strip single leading zero (common in local Indian dialing)
  if (clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  // If local 10-digit number without country code, prepend the country code
  if (clean.length === 10) {
    clean = `${cleanCode}${clean}`;
  }

  return clean;
}

function toJid(phone) {
  const clean = normalizeE164(phone);
  return `${clean}@s.whatsapp.net`;
}

function getContacts() {
  return readJson(CONTACTS_FILE, []);
}

function saveContacts(contacts) {
  writeJson(CONTACTS_FILE, contacts);
}

function appendLog(entry) {
  const logs = readJson(LOG_FILE, []);
  logs.unshift({ ...entry, timestamp: new Date().toISOString() });
  writeJson(LOG_FILE, logs.slice(0, 500));
}

// ─── Weather Data Helper ──────────────────────────────────────────────────────
async function fetchLocalityWeather(locality = 'Bengaluru Urban') {
  const cityCoords = {
    bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru Urban' },
    bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru Urban' },
    delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi NCR' },
    mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
    hyderabad: { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
    chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
    kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
    ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
  };

  const matchKey = Object.keys(cityCoords).find(k => locality.toLowerCase().includes(k));
  const coord = matchKey ? cityCoords[matchKey] : { lat: 12.9716, lon: 77.5946, name: locality || 'Bengaluru Urban' };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&current=temperature_2m,relative_humidity_2m&daily=temperature_2m_max,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const currentTemp = Math.round(data?.current?.temperature_2m ?? 32);
      const humidity = Math.round(data?.current?.relative_humidity_2m ?? 50);
      const peakTemp = Math.round(data?.daily?.temperature_2m_max?.[0] ?? (currentTemp + 4));
      const rainChance = Math.round(data?.daily?.precipitation_probability_max?.[0] ?? 10);
      return {
        locality: coord.name,
        temp: currentTemp,
        peakTemp,
        humidity,
        rainChance,
      };
    }
  } catch (err) {
    logger.warn(`Open-Meteo fetch failed for ${locality}: ${err.message}. Using fallback weather data.`);
  }

  return {
    locality: coord.name,
    temp: 32,
    peakTemp: 36,
    humidity: 50,
    rainChance: 15,
  };
}

// ─── WhatsApp Baileys Connection ──────────────────────────────────────────────
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    logger.info(`Baileys version: ${version.join('.')}`);

    sock = makeWASocket({
      version,
      logger: logger.child({ module: 'baileys' }),
      browser: Browsers.macOS('HeatShield AI'),
      auth: state,
      printQRInTerminal: true,
      getMessage: async (_key) => undefined
    });


    // Connection lifecycle
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'qr_ready';
        currentQR = await QRCode.toDataURL(qr).catch(() => null);
        logger.info('QR code updated — scan from the Admin Gateway or terminal');
      }

      if (connection === 'close') {
        currentQR = null;
        const statusCode = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : 500;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        logger.warn(`Connection closed (code ${statusCode}). Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          connectionStatus = 'connecting';
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectToWhatsApp, 5000);
        } else {
          connectionStatus = 'logged_out';
          logger.info('Logged out from WhatsApp. Re-open gateway to generate new QR.');
        }
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        currentQR = null;
        logger.info('WhatsApp connection established successfully ✅');
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    logger.error(`Error establishing WhatsApp connection: ${err.message}`);
    connectionStatus = 'connecting';
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectToWhatsApp, 10000);
  }
}

// ─── Core Message Sending ─────────────────────────────────────────────────────
async function sendWhatsAppMessage(phone, message, retries = 0) {
  if (DRY_RUN) {
    logger.info(`[DRY RUN] Would send to ${phone}: ${message.slice(0, 60)}...`);
    return { success: true, dryRun: true };
  }

  if (connectionStatus !== 'connected' || !sock) {
    throw new Error('WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI');
  }

  const jid = toJid(phone);
  try {
    const sent = await sock.sendMessage(jid, { text: message });
    logger.info(`Sent message to ${phone}: msgId=${sent?.key?.id}`);
    return { success: true, messageId: sent?.key?.id };
  } catch (err) {
    if (retries < MAX_RETRIES) {
      logger.warn(`Send failed for ${phone}, retrying (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, 1500 * (retries + 1)));
      return sendWhatsAppMessage(phone, message, retries + 1);
    }
    throw err;
  }
}

// ─── Daily 6:00 AM Weather Briefing Routine ────────────────────────────────────
async function runDailyBriefing(options = {}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const contacts = getContacts();
  // Filter for opted-in and daily briefing enabled
  const eligible = contacts.filter(c => c.optedIn !== false && c.preferences?.dailyBriefing !== false);

  logger.info(`Running HeatShield AI Daily 6:00 AM Weather Briefing for ${eligible.length} contact(s)...`);

  const results = [];
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const contact of eligible) {
    const idempotencyKey = `daily-briefing-${contact.phone}-${todayStr}`;
    const logs = readJson(LOG_FILE, []);
    const alreadySent = logs.some(l => l.idempotencyKey === idempotencyKey && l.result?.success);

    if (alreadySent && !options.forceImmediate) {
      logger.info(`Skipping ${contact.phone} — daily briefing already delivered today (${todayStr})`);
      skippedCount++;
      results.push({ phone: contact.phone, status: 'skipped', reason: 'already_sent_today' });
      continue;
    }

    const weather = await fetchLocalityWeather(contact.locality || 'Bengaluru Urban');
    const peakTemp = weather.peakTemp;
    let riskLevel = 'Low (Green)';
    let safetyAdvice = 'Favourable thermal conditions. Stay routinely hydrated and protect against UV rays.';

    if (peakTemp >= 40) {
      riskLevel = 'Extreme (Red)';
      safetyAdvice = 'Stay indoors between 11 AM - 4 PM. Drink oral rehydration fluids and check on elderly neighbors.';
    } else if (peakTemp >= 36) {
      riskLevel = 'High (Orange)';
      safetyAdvice = 'High thermal stress. Drink water every 20 minutes, seek shaded transit routes, and avoid direct midday sun.';
    } else if (peakTemp >= 32) {
      riskLevel = 'Moderate (Yellow)';
      safetyAdvice = 'Elevated afternoon temperatures. Carry a reusable water bottle, wear light cotton clothes, and stay hydrated.';
    }

    const message = [
      `☀️ GOOD MORNING — HEATSHIELD AI`,
      `Today's Heat Report`,
      `📍 Your area: ${weather.locality}`,
      `🌡 Temperature: ${weather.temp}°C (Peak: ${peakTemp}°C)`,
      `🔥 Heat Risk: ${riskLevel}`,
      `💧 Humidity: ${weather.humidity}%`,
      `🌧 Rain chance: ${weather.rainChance}%`,
      `⏰ Peak heat: 12:00 PM – 4:00 PM`,
      `💡 Recommendation: ${safetyAdvice}`
    ].join('\n');

    if (connectionStatus === 'connected' && sock) {
      try {
        const sendResult = await sendWhatsAppMessage(contact.phone, message);
        sentCount++;
        results.push({ phone: contact.phone, status: 'sent', result: sendResult });
        appendLog({
          type: 'daily_briefing',
          idempotencyKey,
          to: contact.phone,
          locality: weather.locality,
          message: message.slice(0, 100),
          result: sendResult
        });
      } catch (err) {
        failedCount++;
        results.push({ phone: contact.phone, status: 'failed', error: err.message });
        appendLog({
          type: 'daily_briefing',
          idempotencyKey,
          to: contact.phone,
          locality: weather.locality,
          result: { success: false, error: err.message }
        });
      }
    } else {
      logger.info(`[Daily Briefing Dev/Simulation] WhatsApp unlinked. Briefing for ${contact.phone}:\n${message}`);
      skippedCount++;
      results.push({
        phone: contact.phone,
        status: 'simulated_unlinked',
        message: 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI'
      });
      appendLog({
        type: 'daily_briefing',
        idempotencyKey,
        to: contact.phone,
        locality: weather.locality,
        result: {
          success: false,
          error: 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI'
        }
      });
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  return {
    success: true,
    date: todayStr,
    totalEligible: eligible.length,
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    results
  };
}

// ─── Automated Scheduler (Every Minute Check for 6:00 AM IST) ──────────────────
setInterval(async () => {
  const now = new Date();
  // IST is UTC + 5:30
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();

  if (hours === 6 && minutes === 0) {
    logger.info('⏰ Auto-Scheduler: 6:00 AM IST reached. Executing HeatShield AI Daily Weather Briefing...');
    try {
      await runDailyBriefing();
    } catch (e) {
      logger.error(`Error in automated 6:00 AM briefing: ${e.message}`);
    }
  }
}, 60000);

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: [
    FRONTEND_ORIGIN,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'https://heatshield-ai-eight.vercel.app'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-secret', 'Authorization'],
}));

// Auth middleware for admin endpoints
function requireSecret(req, res, next) {
  const secret = req.headers['x-api-secret'];
  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing x-api-secret header' });
  }
  next();
}

// ─── Public Gateway Status Endpoints ──────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  const isConnected = connectionStatus === 'connected';
  res.json({
    service: 'HeatShield WhatsApp Gateway',
    brand: 'HeatShield AI',
    status: 'ok',
    whatsapp: connectionStatus,
    connected: isConnected,
    message: isConnected
      ? 'HeatShield AI WhatsApp Gateway is connected and active.'
      : 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI',
    contacts: getContacts().length,
    dryRun: DRY_RUN,
    uptime: Math.floor(process.uptime()),
  });
});

// Connection status
app.get('/status', (_req, res) => {
  const isConnected = connectionStatus === 'connected';
  res.json({
    status: connectionStatus,
    connected: isConnected,
    message: isConnected
      ? 'HeatShield AI WhatsApp Gateway is connected and active.'
      : 'WhatsApp gateway not linked. Scan QR code in Admin Gateway to link HeatShield AI',
    qrAvailable: Boolean(currentQR)
  });
});

// QR code (base64 PNG)
app.get('/qr', (_req, res) => {
  if (connectionStatus === 'connected') {
    return res.json({ status: 'connected', qr: null, message: 'WhatsApp Gateway already connected.' });
  }
  if (!currentQR) {
    return res.json({ status: connectionStatus, qr: null, message: 'QR not yet generated — please wait a moment' });
  }
  res.json({ status: 'qr_ready', qr: currentQR });
});

// ─── Real Server-Side OTP Verification Endpoints ──────────────────────────────

/**
 * POST /api/otp/request
 * Body: { phone, countryCode }
 * Rate limiting: max 3 requests per phone per 10 minutes, 60s cooldown
 */
app.post('/api/otp/request', async (req, res) => {
  const { phone, countryCode = '+91' } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const cleanPhone = normalizeE164(phone, countryCode);
  if (cleanPhone.length < 8 || cleanPhone.length > 15) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid mobile number (8 to 15 digits).'
    });
  }

  const now = Date.now();
  let challenge = activeOtps.get(cleanPhone);

  if (challenge) {
    // Check 60-second cooldown
    if (now < challenge.resendCooldownUntil) {
      const waitSec = Math.ceil((challenge.resendCooldownUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before requesting another verification code.`,
        cooldownSeconds: waitSec
      });
    }

    // Rate limiting: clean timestamps older than 10 minutes
    challenge.requestTimestamps = (challenge.requestTimestamps || []).filter(t => now - t < 10 * 60 * 1000);
    if (challenge.requestTimestamps.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Maximum OTP request limit reached (3 requests per 10 minutes). Please try again later.'
      });
    }
  } else {
    challenge = {
      requestTimestamps: [],
      countryCode
    };
  }

  // Generate cryptographically secure 6-digit OTP (100000 - 999999)
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(rawOtp, cleanPhone);

  challenge.requestTimestamps.push(now);
  challenge.hash = hashedOtp;
  challenge.rawOtp = rawOtp; // for dev log inspection
  challenge.expiresAt = now + 5 * 60 * 1000; // 5 minutes expiry
  challenge.attemptsRemaining = 5;
  challenge.resendCooldownUntil = now + 60 * 1000; // 60s cooldown
  challenge.phone = cleanPhone;
  challenge.countryCode = countryCode;

  activeOtps.set(cleanPhone, challenge);

  // Formulate strictly branded message
  const otpMessage = `HeatShield AI: Your verification code is ${rawOtp}. Valid for 5 minutes. Do not share this code with anyone.`;

  let sentViaWhatsApp = false;
  let errorNotice = null;

  if (connectionStatus === 'connected' && sock) {
    try {
      await sendWhatsAppMessage(cleanPhone, otpMessage);
      sentViaWhatsApp = true;
      appendLog({
        type: 'otp',
        to: cleanPhone,
        message: `HeatShield AI Verification OTP dispatched`,
        result: { success: true }
      });
    } catch (err) {
      logger.warn(`Failed to deliver OTP via WhatsApp: ${err.message}`);
      errorNotice = err.message;
    }
  } else {
    logger.info(`[HeatShield AI OTP] (WhatsApp Gateway unlinked) Dispatched to ${cleanPhone}: [${rawOtp}]`);
  }

  const masked = cleanPhone.length > 5
    ? `${cleanPhone.slice(0, 3)}••••${cleanPhone.slice(-4)}`
    : cleanPhone;

  return res.json({
    success: true,
    message: sentViaWhatsApp
      ? `Verification code sent to ${masked} via WhatsApp. Valid for 5 minutes.`
      : `Verification code generated for ${masked}. Valid for 5 minutes. (Gateway status: ${connectionStatus})`,
    channel: sentViaWhatsApp ? 'whatsapp' : 'dev_simulated',
    gatewayConnected: connectionStatus === 'connected',
    cooldownSeconds: 60,
    // Return devOtp when running locally or unlinked so testing is never blocked
    devOtp: (process.env.NODE_ENV !== 'production' || !sentViaWhatsApp) ? rawOtp : undefined
  });
});

/**
 * POST /api/otp/verify
 * Body: { phone, countryCode, otp, preferences, userId }
 */
app.post('/api/otp/verify', (req, res) => {
  const { phone, countryCode = '+91', otp, preferences, userId } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and 6-digit OTP code are required' });
  }

  const cleanPhone = normalizeE164(phone, countryCode);
  const cleanOtp = String(otp).trim().replace(/\D/g, '');

  if (cleanOtp.length !== 6) {
    return res.status(400).json({ success: false, message: 'Verification code must be exactly 6 digits.' });
  }

  const challenge = activeOtps.get(cleanPhone);
  const now = Date.now();

  if (!challenge) {
    return res.status(400).json({
      success: false,
      message: 'No active OTP verification session found. Please request a new code.'
    });
  }

  // Check expiry (5 minutes)
  if (now > challenge.expiresAt) {
    activeOtps.delete(cleanPhone);
    return res.status(400).json({
      success: false,
      message: 'The verification code has expired (valid for 5 minutes). Please request a new code.'
    });
  }

  // Check attempts remaining
  if (challenge.attemptsRemaining <= 0) {
    activeOtps.delete(cleanPhone);
    return res.status(400).json({
      success: false,
      message: 'Too many incorrect attempts. This verification code has been invalidated for security.'
    });
  }

  const candidateHash = hashOtp(cleanOtp, cleanPhone);

  if (candidateHash !== challenge.hash) {
    challenge.attemptsRemaining -= 1;
    if (challenge.attemptsRemaining <= 0) {
      activeOtps.delete(cleanPhone);
      return res.status(400).json({
        success: false,
        message: 'Invalid code. Maximum attempts exceeded. Please request a new code.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Incorrect code. ${challenge.attemptsRemaining} attempt(s) remaining.`
    });
  }

  // Verification Succeeded! Invalidate used OTP immediately
  activeOtps.delete(cleanPhone);

  const verificationToken = crypto.randomBytes(24).toString('hex');
  const verifiedAt = new Date().toISOString();

  // Register or update verified resident contact
  const contacts = getContacts();
  let contact = contacts.find(c => c.phone === cleanPhone);

  const userPrefs = {
    dailyBriefing: preferences?.dailyBriefing ?? true,
    extremeHeatAlerts: preferences?.extremeHeatAlerts ?? true,
    severeWeatherAlerts: preferences?.severeWeatherAlerts ?? true
  };

  if (!contact) {
    contact = {
      id: `c-${Date.now()}`,
      name: preferences?.name || 'Resident',
      phone: cleanPhone,
      countryCode,
      locality: preferences?.locality || 'Bengaluru Urban',
      verified: true,
      verifiedAt,
      optedIn: true,
      optedInAt: verifiedAt,
      preferences: userPrefs,
      userId: userId || null,
      addedAt: verifiedAt
    };
    contacts.push(contact);
  } else {
    contact.verified = true;
    contact.verifiedAt = verifiedAt;
    contact.optedIn = true;
    contact.preferences = {
      ...contact.preferences,
      ...userPrefs
    };
    if (userId) contact.userId = userId;
  }

  saveContacts(contacts);
  logger.info(`Phone number verified successfully: ${cleanPhone}`);

  return res.json({
    success: true,
    message: 'Mobile number verified successfully with HeatShield AI!',
    verifiedAt,
    token: verificationToken,
    phone: cleanPhone,
    contact
  });
});

// ─── WhatsApp User Opt-In & Preferences Endpoints ─────────────────────────────

/**
 * POST /api/opt-in
 * Explicit resident consent and notification preferences.
 */
app.post('/api/opt-in', async (req, res) => {
  const {
    phone,
    countryCode = '+91',
    name = 'Resident',
    locality = 'Bengaluru Urban',
    preferences,
    userId
  } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required for WhatsApp opt-in.' });
  }

  const cleanPhone = normalizeE164(phone, countryCode);
  const contacts = getContacts();
  let contact = contacts.find(c => c.phone === cleanPhone);
  const nowIso = new Date().toISOString();

  const userPrefs = {
    dailyBriefing: preferences?.dailyBriefing ?? true,
    extremeHeatAlerts: preferences?.extremeHeatAlerts ?? true,
    severeWeatherAlerts: preferences?.severeWeatherAlerts ?? true,
  };

  if (!contact) {
    contact = {
      id: `c-${Date.now()}`,
      name: name.trim() || 'Resident',
      phone: cleanPhone,
      countryCode,
      locality: locality.trim() || 'Bengaluru Urban',
      verified: true,
      verifiedAt: nowIso,
      optedIn: true,
      optedInAt: nowIso,
      preferences: userPrefs,
      userId: userId || null,
      addedAt: nowIso
    };
    contacts.push(contact);
  } else {
    contact.name = name.trim() || contact.name;
    contact.locality = locality.trim() || contact.locality;
    contact.optedIn = true;
    contact.optedInAt = nowIso;
    contact.preferences = {
      ...contact.preferences,
      ...userPrefs
    };
    if (userId) contact.userId = userId;
  }

  saveContacts(contacts);
  logger.info(`WhatsApp opt-in updated for: ${contact.name} (${cleanPhone})`);

  // Send branded confirmation if WhatsApp socket is open
  let welcomeSent = false;
  if (connectionStatus === 'connected' && sock) {
    try {
      const welcomeMsg = [
        `✅ *Welcome to HeatShield AI!*`,
        ``,
        `Hi ${contact.name}, you are registered for HeatShield AI WhatsApp alerts for *${contact.locality}*.`,
        ``,
        `Active Preferences:`,
        `• ☀️ Daily Morning Briefing (6:00 AM)`,
        `• 🔴 Extreme Heatwave Flash Alerts`,
        `• ⛈️ Severe Weather Alerts`,
        ``,
        `Stay cool and hydrated! 🧊`,
        `—HeatShield AI Team`
      ].join('\n');

      await sendWhatsAppMessage(cleanPhone, welcomeMsg);
      welcomeSent = true;
    } catch (e) {
      logger.warn(`Could not dispatch welcome message: ${e.message}`);
    }
  }

  res.json({
    success: true,
    message: welcomeSent
      ? 'Subscribed to HeatShield AI WhatsApp notifications! Confirmation sent.'
      : 'Saved WhatsApp notification preferences successfully.',
    contact,
    gatewayConnected: connectionStatus === 'connected'
  });
});

/**
 * GET /api/opt-in/:phone
 * Retrieve current opt-in status and preferences
 */
app.get('/api/opt-in/:phone', (req, res) => {
  const cleanPhone = normalizeE164(req.params.phone, req.query.countryCode || '+91');
  const contacts = getContacts();
  const contact = contacts.find(c => c.phone === cleanPhone);

  if (!contact) {
    return res.json({
      optedIn: false,
      verified: false,
      preferences: {
        dailyBriefing: true,
        extremeHeatAlerts: true,
        severeWeatherAlerts: true
      }
    });
  }

  res.json({
    optedIn: Boolean(contact.optedIn),
    verified: Boolean(contact.verified),
    preferences: contact.preferences || {
      dailyBriefing: true,
      extremeHeatAlerts: true,
      severeWeatherAlerts: true
    },
    contact
  });
});

// ─── Daily Briefing Trigger Endpoints ─────────────────────────────────────────

app.post('/api/cron/daily-briefing', async (req, res) => {
  try {
    const forceImmediate = Boolean(req.body?.forceImmediate || req.query?.force === 'true');
    const result = await runDailyBriefing({ forceImmediate });
    res.json(result);
  } catch (err) {
    logger.error(`Daily briefing execution failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/cron/daily-briefing', async (req, res) => {
  try {
    const forceImmediate = req.query?.force === 'true';
    const result = await runDailyBriefing({ forceImmediate });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Direct WhatsApp Messaging & Broadcast Endpoints (Admin Authenticated) ────

// Send single message
app.post('/send', requireSecret, async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: '`to` (phone number) and `message` are required' });
  }

  try {
    const result = await sendWhatsAppMessage(to, message);
    appendLog({ type: 'single', to, message: message.slice(0, 100), result });
    res.json({ success: true, ...result });
  } catch (err) {
    appendLog({ type: 'single', to, message: message.slice(0, 100), result: { error: err.message } });
    res.status(503).json({ success: false, error: err.message });
  }
});

// Broadcast to multiple contacts
app.post('/broadcast', requireSecret, async (req, res) => {
  const { contacts, message, delayMs = 1500 } = req.body;
  if (!Array.isArray(contacts) || !message) {
    return res.status(400).json({ error: '`contacts` (array of phone numbers) and `message` are required' });
  }

  const results = [];
  for (const phone of contacts) {
    try {
      const result = await sendWhatsAppMessage(phone, message);
      results.push({ phone, success: true, ...result });
    } catch (err) {
      results.push({ phone, success: false, error: err.message });
    }
    if (delayMs > 0 && contacts.indexOf(phone) < contacts.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  appendLog({ type: 'broadcast', count: contacts.length, message: message.slice(0, 100), results });
  res.json({ success: true, total: contacts.length, results });
});

// List contacts
app.get('/contacts', (_req, res) => {
  res.json(getContacts());
});

// Add contact
app.post('/contacts', requireSecret, (req, res) => {
  const { name, phone, locality, countryCode = '+91' } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: '`name` and `phone` are required' });
  }

  const contacts = getContacts();
  const cleanPhone = normalizeE164(phone, countryCode);
  const existing = contacts.find(c => c.phone === cleanPhone);
  if (existing) {
    return res.status(409).json({ error: 'Contact with this phone number already exists', contact: existing });
  }

  const newContact = {
    id: `c-${Date.now()}`,
    name,
    phone: cleanPhone,
    countryCode,
    locality: locality || '',
    verified: true,
    optedIn: true,
    preferences: {
      dailyBriefing: true,
      extremeHeatAlerts: true,
      severeWeatherAlerts: true
    },
    addedAt: new Date().toISOString(),
  };
  contacts.push(newContact);
  saveContacts(contacts);
  logger.info(`Contact added: ${name} (${cleanPhone})`);
  res.status(201).json(newContact);
});

// Remove contact
app.delete('/contacts/:phone', requireSecret, (req, res) => {
  const phone = normalizeE164(req.params.phone);
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.phone === phone);
  if (idx === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  const removed = contacts.splice(idx, 1)[0];
  saveContacts(contacts);
  logger.info(`Contact removed: ${removed.name} (${phone})`);
  res.json({ success: true, removed });
});

// Delivery logs
app.get('/logs', (_req, res) => {
  const logs = readJson(LOG_FILE, []);
  res.json(logs.slice(0, 100));
});

// Disconnect / logout
app.post('/disconnect', requireSecret, async (_req, res) => {
  try {
    await sock?.logout();
    connectionStatus = 'logged_out';
    res.json({ success: true, message: 'Logged out from WhatsApp' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const httpServer = createServer(app);

httpServer.listen(PORT, HOST, async () => {
  logger.info(`HeatShield AI WhatsApp Gateway running at http://${HOST}:${PORT}`);
  logger.info(`Dry-run mode: ${DRY_RUN}`);
  await connectToWhatsApp();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await sock?.end(undefined);
  httpServer.close(() => process.exit(0));
});
process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down gracefully');
  await sock?.end(undefined);
  httpServer.close(() => process.exit(0));
});
