# HeatShield AI — WhatsApp Notification Service

A lightweight **open-source WhatsApp gateway** that links **your personal WhatsApp number** to the HeatShield AI platform so heat-risk alerts can be sent directly to residents over WhatsApp.

> **Powered by [Baileys](https://github.com/WhiskeySockets/Baileys)** — the leading open-source Node.js WhatsApp Web API library. No Meta Cloud API fees or approvals required.

---

## How It Works

```
HeatShield AI frontend/backend
         │  POST /send or /broadcast
         ▼
 WhatsApp Gateway (Express + Baileys)      ←── QR scan from your phone
         │
         ▼
 WhatsApp Web Protocol (your number)
         │
         ▼
 Resident's WhatsApp (message received)
```

You **scan a QR code** in the HeatShield Admin panel once — exactly like linking WhatsApp Web on a PC. After that, the service sends messages from your number automatically.

---

## Setup

### 1. Install dependencies
```bash
cd whatsapp-service
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
| Variable | Description |
|---|---|
| `PORT` | Service port (default `3100`) |
| `API_SECRET` | A strong random string — used to authenticate the HeatShield app |
| `FRONTEND_ORIGIN` | Your frontend URL for CORS |
| `SESSION_DIR` | Where Baileys stores your WhatsApp auth session |
| `DRY_RUN` | Set `true` to test without actually sending |

### 3. Start the service
```bash
npm start
# or for development with auto-restart:
npm run dev
```

### 4. Scan the QR code
Open the HeatShield Admin panel → **WhatsApp** tab → scan the QR code with your WhatsApp phone app:  
`WhatsApp → Linked Devices → Link a Device`

The session is saved in `./sessions/` — you only need to scan once (it persists across restarts).

---

## API Reference

All `POST` and `DELETE` endpoints require the `x-api-secret` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health + WhatsApp status |
| `GET` | `/status` | Connection state (`connecting` / `qr_ready` / `connected` / `logged_out`) |
| `GET` | `/qr` | QR code as base64 PNG (poll while status is `qr_ready`) |
| `POST` | `/send` | Send to one number `{ to, message }` |
| `POST` | `/broadcast` | Send to multiple `{ contacts: [phone,...], message, delayMs? }` |
| `GET` | `/contacts` | List all saved contacts |
| `POST` | `/contacts` | Add contact `{ name, phone, locality?, countryCode? }` |
| `DELETE` | `/contacts/:phone` | Remove a contact |
| `GET` | `/logs` | Last 100 delivery log entries |
| `POST` | `/disconnect` | Logout from WhatsApp |

### Phone number format
Pass phone numbers **without `+` or spaces**, e.g.:
- India: `919876543210` (country code 91 + 10-digit mobile)
- Numbers starting with `0` are auto-prefixed with India's `91`

---

## Security Notes
- Keep `API_SECRET` private — only the HeatShield backend/admin should know it
- Run behind a firewall or localhost tunnel — do **not** expose this service publicly without authentication
- WhatsApp may flag numbers that send bulk messages; use `delayMs` (default 1500 ms) between sends
- The `sessions/` folder contains your WhatsApp authentication — keep it secure and do not commit it to git

---

## Connecting to HeatShield AI

Set these in the main app's `.env` or `.env.local`:
```
VITE_WHATSAPP_GATEWAY_URL=http://localhost:3100
VITE_WHATSAPP_API_SECRET=your-api-secret-here
```

The HeatShield Admin panel's **WhatsApp** tab will auto-detect these variables and show the QR scanner, contact manager, and broadcast console.
