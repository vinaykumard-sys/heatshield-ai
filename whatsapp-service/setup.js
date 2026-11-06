#!/usr/bin/env node
/**
 * HeatShield AI — WhatsApp Gateway Setup Script
 * Run: node whatsapp-service/setup.js
 * Creates the .env file from the example with a securely generated API_SECRET.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('.env already exists — skipping setup. Edit it manually if needed.');
  process.exit(0);
}

const secret = crypto.randomBytes(32).toString('hex');
const example = fs.readFileSync(examplePath, 'utf8');
const env = example.replace('change-me-to-a-long-random-string', secret);
fs.writeFileSync(envPath, env, 'utf8');

console.log(`
✅ HeatShield WhatsApp Gateway configured!

Generated API_SECRET: ${secret}

IMPORTANT: Copy this secret into your main app's .env.local:
  VITE_WHATSAPP_API_SECRET=${secret}

Next steps:
  1. npm install         (in this folder)
  2. npm start           (starts the gateway)
  3. Scan the QR in the HeatShield Admin panel → WhatsApp Gateway
`);
