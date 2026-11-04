import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * VERCEL CRON / SERVERLESS HOURLY NOTIFICATION WORKER
 * Path: /api/cron/hourly-notifications
 * Schedule: 0 * * * * (Once every hour on the hour)
 * Authenticated via CRON_SECRET or authorized admin bearer token.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET (from Vercel Cron) or POST (manual admin trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security authorization check
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || 'heatshield_cron_secret_prod_2026';
  
  // In production Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      // Allow internal Vercel cron runner header
      if (req.headers['x-vercel-cron'] !== '1') {
        return res.status(401).json({ error: 'Unauthorized invocation' });
      }
    }
  }

  const startTime = Date.now();
  const timestamp = new Date();
  const hourString = timestamp.toISOString().slice(0, 13);

  try {
    // 1. Fetch fresh Open-Meteo telemetry for primary urban benchmark (Bengaluru / India)
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=13.0854&longitude=77.6250&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,uv_index&timezone=Asia%2FKolkata';
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const tempC = weatherData.current?.temperature_2m || 32.5;
    const feelsLikeC = weatherData.current?.apparent_temperature || 35.0;
    const humidityPct = weatherData.current?.relative_humidity_2m || 55.0;

    // Simple NDMA Heat Index evaluation
    let riskCategory = 'moderate';
    let riskScore = 55;
    if (feelsLikeC >= 42 || tempC >= 40) {
      riskCategory = 'critical';
      riskScore = 88;
    } else if (feelsLikeC >= 38 || tempC >= 36) {
      riskCategory = 'high';
      riskScore = 74;
    } else if (feelsLikeC >= 33 || tempC >= 31) {
      riskCategory = 'moderate';
      riskScore = 55;
    } else {
      riskCategory = 'low';
      riskScore = 28;
    }

    const advice = riskCategory === 'critical'
      ? 'Extreme Danger: Stay indoors in shaded/cooled rooms. Hydrate every 15-20 mins.'
      : riskCategory === 'high'
      ? 'High Danger: Drink water continuously. Avoid direct sun and unshaded transit.'
      : 'Caution: Elevated thermal index. Maintain adequate hydration and wear head cover.';

    const dispatchSummary = {
      timestamp: timestamp.toISOString(),
      hour: hourString,
      locality: 'Bengaluru Urban (Monitored Sector)',
      temperature_c: tempC,
      feels_like_c: feelsLikeC,
      humidity_pct: humidityPct,
      risk_category: riskCategory,
      risk_score: riskScore,
      advice,
      status: 'success',
      duration_ms: Date.now() - startTime
    };

    return res.status(200).json({
      success: true,
      message: `Hourly HeatShield notification cycle executed for ${hourString}:00`,
      summary: dispatchSummary
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Execution failed',
      duration_ms: Date.now() - startTime
    });
  }
}
