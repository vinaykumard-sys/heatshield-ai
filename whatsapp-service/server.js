/**
 * HEATSHIELD AI — WhatsApp Notification Gateway
 * ------------------------------------------------
 * Uses @whiskeysockets/baileys (open-source WhatsApp Web API client) to link
 * YOUR WhatsApp number (via QR code scan) and send heat-risk alerts to residents.
 *
 * Architecture:
 *  - Express HTTP server exposes REST endpoints for the HeatShield frontend/backend
 *  - Baileys manages the WhatsApp Web socket connection + authentication session
 *  - QR code is served over HTTP (GET /qr) so the Admin panel can display it inline
 *  - Contact list is managed in-memory + persisted to contacts.json
 *  - All sent messages are logged to sent-log.json (last 500 entries)
 *
 * Endpoints:
 *  GET  /health                    → service status + WA connection state
 *  GET  /qr                        → returns QR code as base64 PNG (for admin scan)
 *  GET  /status                    → connected / connecting / logged_out
 *  POST /send                      → send single message  { to, message }
 *  POST /broadcast                 → send to multiple contacts { contacts[], message }
 *  GET  /contacts                  → list registered contacts
 *  POST /contacts                  → add contact          { name, phone, locality }
 *  DELETE /contacts/:phone         → remove contact
 *  GET  /logs                      → delivery log (last 100)
 *  POST /disconnect                → logout from WhatsApp
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';

// ─── Config ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3100', 10);
const HOST = process.env.HOST || 'localhost';
const API_SECRET = process.env.API_SECRET || 'heatshield-secret';
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
let currentQR = null;          // base64 QR image string
let connectionStatus = 'connecting'; // 'connecting' | 'connected' | 'logged_out' | 'qr_ready'
let sock = null;               // Baileys socket
let reconnectTimer = null;

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

// ─── Contacts ─────────────────────────────────────────────────────────────────
/**
 * A contact record: { id, name, phone, countryCode, locality, addedAt }
 * phone should be in E.164 format: e.g. 919876543210 (no +, no spaces)
 */
function getContacts() {
  return readJson(CONTACTS_FILE, []);
}

function saveContacts(contacts) {
  writeJson(CONTACTS_FILE, contacts);
}

/**
 * Normalises a phone number to WhatsApp JID format: 919876543210@s.whatsapp.net
 */
function toJid(phone) {
  const clean = String(phone).replace(/\D/g, '');
  // If it starts with 0, strip leading 0 and assume India (+91)
  const normalized = clean.startsWith('0') ? `91${clean.slice(1)}` : clean;
  return `${normalized}@s.whatsapp.net`;
}

// ─── Delivery log ─────────────────────────────────────────────────────────────
function appendLog(entry) {
  const logs = readJson(LOG_FILE, []);
  logs.unshift({ ...entry, timestamp: new Date().toISOString() });
  writeJson(LOG_FILE, logs.slice(0, 500));
}

// ─── WhatsApp Connection ──────────────────────────────────────────────────────
const store = makeInMemoryStore({ logger: logger.child({ module: 'store' }) });

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  logger.info(`Baileys version: ${version.join('.')}`);

  sock = makeWASocket({
    version,
    logger: logger.child({ module: 'baileys' }),
    browser: Browsers.macOS('HeatShield AI'),
    auth: state,
    printQRInTerminal: true,  // also print QR to terminal as fallback
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return undefined;
    }
  });

  store?.bind(sock.ev);

  // Handle QR code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = 'qr_ready';
      currentQR = await QRCode.toDataURL(qr).catch(() => null);
      logger.info('QR code updated — scan from the Admin panel or terminal');
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
        logger.info('Logged out from WhatsApp. Delete the sessions folder and restart to re-link.');
      }
    }

    if (connection === 'open') {
      connectionStatus = 'connected';
      currentQR = null;
      logger.info('WhatsApp connection established ✅');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// ─── Message sending ──────────────────────────────────────────────────────────
async function sendWhatsAppMessage(phone, message, retries = 0) {
  if (DRY_RUN) {
    logger.info(`[DRY RUN] Would send to ${phone}: ${message.slice(0, 60)}...`);
    return { success: true, dryRun: true };
  }

  if (connectionStatus !== 'connected' || !sock) {
    throw new Error('WhatsApp is not connected. Status: ' + connectionStatus);
  }

  const jid = toJid(phone);
  try {
    const sent = await sock.sendMessage(jid, { text: message });
    logger.info(`Sent to ${phone}: msgId=${sent?.key?.id}`);
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

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: [FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-secret'],
}));

// Auth middleware (all write endpoints)
function requireSecret(req, res, next) {
  const secret = req.headers['x-api-secret'];
  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing x-api-secret header' });
  }
  next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({
    service: 'HeatShield WhatsApp Gateway',
    status: 'ok',
    whatsapp: connectionStatus,
    contacts: getContacts().length,
    dryRun: DRY_RUN,
    uptime: Math.floor(process.uptime()),
  });
});

// Connection status
app.get('/status', (_req, res) => {
  res.json({ status: connectionStatus });
});

// QR code (base64 PNG) — no auth required so Admin panel can poll it
app.get('/qr', (_req, res) => {
  if (connectionStatus === 'connected') {
    return res.json({ status: 'connected', qr: null });
  }
  if (!currentQR) {
    return res.json({ status: connectionStatus, qr: null, message: 'QR not yet generated — please wait a moment' });
  }
  res.json({ status: 'qr_ready', qr: currentQR });
});

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
    // Polite delay between sends (avoid WhatsApp rate-limiting)
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
  const { name, phone, locality, countryCode = '91' } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: '`name` and `phone` are required' });
  }

  const contacts = getContacts();
  const cleanPhone = String(phone).replace(/\D/g, '');
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
    addedAt: new Date().toISOString(),
  };
  contacts.push(newContact);
  saveContacts(contacts);
  logger.info(`Contact added: ${name} (${cleanPhone})`);
  res.status(201).json(newContact);
});

// Remove contact
app.delete('/contacts/:phone', requireSecret, (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '');
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
  logger.info(`HeatShield WhatsApp Gateway running at http://${HOST}:${PORT}`);
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
  await sock?.end(undefined);
  httpServer.close(() => process.exit(0));
});
