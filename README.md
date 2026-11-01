# HeatShield AI (हीटशील्ड एआई / ಹೀಟ್‌ಶೀಲ್ಡ್ ಎಐ)
### AI-Powered Hyperlocal Heat Risk Prediction & Community Protection Platform for India
> **Tagline:** Predict. Protect. Prevent.

---

## 1. Overview & Objectives

**HeatShield AI** is a production-grade web application tailored for Indian urban and semi-urban communities (e.g., Delhi, Ahmedabad, Bengaluru, Chennai, Nagpur, Hyderabad, Jaipur, and Mumbai). It monitors environmental thermal loads, calculates explainable hyperlocal heat-risk scores, identifies vulnerable residents (elderly, infants, tin/asbestos roof dwellers, outdoor laborers), and coordinates community volunteer welfare check-ins and emergency cooling relief.

> [!IMPORTANT]
> **Non-Medical Disclaimer:** HeatShield AI calculates environmental heat risk indicators and community vulnerability factors. It does **not** provide medical diagnoses or predict clinical individual emergencies. If an individual displays signs of heatstroke, dial **108 / 112** or transport them to the nearest clinical health center immediately.

---

## 2. Core Features

- **Hyperlocal Heat Risk Engine:**
  - 0–100 explainable scoring model balancing ambient temperature, humidity heat index (Steadman/Rothfusz formulas), wet bulb estimates, urban heat island (UHI) density, and diurnal peak afternoon radiation.
  - Transparent factor contribution breakdown displayed for every zone.
- **Multilingual Support:**
  - Native language switching between **English**, **Hindi (हिन्दी)**, and **Kannada (ಕನ್ನಡ)** affecting all labels, advisories, action protocols, and forms.
- **Interactive Leaflet Heat Risk Map:**
  - OpenStreetMap tiles with custom dark theme.
  - Color-coded thermal severity markers (Green <38, Amber 38-61, Orange 62-79, Red ≥80).
  - Dynamic zone polygons representing urban heat island exposure radius.
  - Filtering by risk tier and active community assistance request overlay.
- **Role-Based Access Control (RBAC):**
  - **Administrator:** Full governance, user role management, threshold weight tuning, and audit logs.
  - **Community Volunteer:** View assigned vulnerable elders, log check-in vitals (hydration, cooling, safety), update request resolutions.
  - **Resident:** Self-service portal to view ward risk, click "Confirm I Am Safe", request cooling/water assistance, and manage privacy consent.
- **Auditable Welfare Check-in System:**
  - Log statuses: `pending`, `in_progress`, `completed`, `unable_to_contact`, and `escalated`.
  - Verifications for hydration access, electric fan/ventilation, and consciousness.
- **Community Response System:**
  - Relief requests for Potable Water/ORS, Cooling Support, Welfare Visits, and Cooling Centre Transport.
- **Analytics & CSV Reporting:**
  - 12-hour temperature/humidity curves, 7-day ward forecasts, neighborhood comparisons, and one-click CSV export.

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Leaflet, React Router DOM.
- **Database & Backend:** Supabase PostgreSQL, Supabase Authentication, Row Level Security (RLS) policies on all 12 tables.
- **Weather & Geolocation:** Open-Meteo API with automatic caching and high-fidelity fallback telemetry.
- **Deployment:** Vercel SPA configuration with `vercel.json` and security headers.

---

## 4. Database Schema (12 Tables)

The complete SQL migration script is located at:
`supabase/migrations/20261031000000_heatshield_schema.sql`

1. `profiles`: Extends Supabase auth users with roles (`admin`, `volunteer`, `resident`).
2. `locations`: Indian urban monitoring zones with coordinates, UHI factors, and baseline vulnerability.
3. `environmental_readings`: Real-time temperature, humidity, heat index, and wet bulb telemetry.
4. `heat_risk_assessments`: Explainable AI risk scores (0-100), factor JSON, and preventive actions.
5. `residents`: High-risk registered community members, age ranges, roof type, and consent timestamps.
6. `volunteer_assignments`: Pairings between authorized volunteers and vulnerable residents.
7. `welfare_checkins`: Detailed check-in logs with vitals, status flags, and escalation reasons.
8. `assistance_requests`: Water, cooling, and shelter assistance tickets.
9. `notifications`: In-app alert history and critical warning banners.
10. `activity_logs`: Immutable security audit logs with timestamps and IP addresses.
11. `risk_thresholds`: Admin-configurable model factor weights (temperature, humidity, UHI, diurnal).
12. `consent_records`: Data protection and voluntary citizen consent records.

---

## 5. Local Setup & Testing

### Prerequisites
- Node.js 18+ or 20+ installed.

### Installation
```bash
# Navigate to project directory
cd heatshield-ai

# Install dependencies
npm install

# Run Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 6. Supabase Connection Guide

To connect your own Supabase project:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project (or select an existing one).
3. Navigate to **SQL Editor** in the Supabase Dashboard.
4. Open the SQL migration file `supabase/migrations/20261031000000_heatshield_schema.sql`, copy its content, paste it into the SQL Editor, and click **Run**.
5. Navigate to **Project Settings > API** and copy:
   - `Project URL`
   - `anon public` key
6. Create a `.env.local` file in your project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
7. Restart the dev server or redeploy. The app will automatically detect Supabase and transition from local resilient mode to live Supabase Cloud!

---

## 7. Vercel Deployment Guide

1. Push your repository to GitHub or run via Vercel CLI.
2. In Vercel, import your project:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. In **Settings > Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. The included `vercel.json` ensures all SPA routes (`/map`, `/portal`, `/admin`, etc.) resolve properly without 404 errors.
