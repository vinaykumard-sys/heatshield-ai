import { EnvironmentalReading } from '../types';
import { calculateHeatIndex, calculateWetBulbEstimate } from './riskEngine';

export interface WeatherFetchResult {
  reading: EnvironmentalReading;
  forecastHourly: Array<{
    time: string;
    temperature_c: number;
    relative_humidity_pct: number;
    heat_index_c: number;
    uv_index?: number;
  }>;
  forecastDaily: Array<{
    date: string;
    max_temp_c: number;
    min_temp_c: number;
    avg_humidity_pct: number;
    uv_index_max?: number;
    risk_level: 'low' | 'moderate' | 'high' | 'critical';
  }>;
  isLive: boolean;
  statusMessage: string;
  lastUpdated: string;
}

// In-memory cache for API calls to prevent rate limits
const cache = new Map<string, { data: WeatherFetchResult; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const LAST_READING_STORAGE_PREFIX = 'heatshield_last_telemetry_';

export async function fetchLiveWeather(
  latitude: number, 
  longitude: number, 
  locationId: string = 'loc-default',
  forceRefresh: boolean = false
): Promise<WeatherFetchResult> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = cache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Asia%2FKolkata&forecast_days=7`;
    
    // 8-second timeout for robust network calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const tempC = Number(current.temperature_2m.toFixed(1));
    const humidityPct = Number(current.relative_humidity_2m.toFixed(1));
    const feelsLikeC = Number(current.apparent_temperature.toFixed(1));
    const heatIndexC = calculateHeatIndex(tempC, humidityPct);
    const wetBulbC = calculateWetBulbEstimate(tempC, humidityPct);

    // Parse hourly forecast for next 12 hours
    const forecastHourly = [];
    let currentUv = 5.0;

    if (data.hourly && data.hourly.time) {
      // Synchronize with API's Asia/Kolkata timezone timestamp from current.time (e.g. "2026-11-02T13:45")
      const currentHourPrefix = current.time ? current.time.slice(0, 13) : '';
      let startIndex = data.hourly.time.findIndex((t: string) => t.startsWith(currentHourPrefix));
      if (startIndex === -1 && current.time) {
        startIndex = data.hourly.time.findIndex((t: string) => t >= current.time);
      }
      if (startIndex === -1) startIndex = 0;

      if (data.hourly.uv_index && data.hourly.uv_index[startIndex] !== undefined) {
        currentUv = Number(data.hourly.uv_index[startIndex].toFixed(1));
      } else if (data.daily?.uv_index_max?.[0]) {
        currentUv = Number((data.daily.uv_index_max[0] * 0.85).toFixed(1));
      }

      for (let i = startIndex; i < Math.min(startIndex + 12, data.hourly.time.length); i++) {
        const hTime = data.hourly.time[i];
        const hTemp = Number(data.hourly.temperature_2m[i].toFixed(1));
        const hHum = Number(data.hourly.relative_humidity_2m[i].toFixed(1));
        const hUv = data.hourly.uv_index ? Number(data.hourly.uv_index[i]?.toFixed(1) || 0) : undefined;
        
        // Use exact hour:minute from ISO string to guarantee consistent Asia/Kolkata local time
        const timeDisplay = hTime.length >= 16 ? hTime.slice(11, 16) : hTime;
        
        forecastHourly.push({
          time: timeDisplay,
          temperature_c: hTemp,
          relative_humidity_pct: hHum,
          heat_index_c: calculateHeatIndex(hTemp, hHum),
          uv_index: hUv
        });
      }
    }

    // Parse 7-day daily forecast
    const forecastDaily = [];
    if (data.daily && data.daily.time) {
      for (let d = 0; d < data.daily.time.length; d++) {
        const maxT = Number(data.daily.temperature_2m_max[d].toFixed(1));
        const minT = Number(data.daily.temperature_2m_min[d].toFixed(1));
        const uvMax = data.daily.uv_index_max ? Number(data.daily.uv_index_max[d]?.toFixed(1)) : undefined;

        let risk_level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
        if (maxT >= 42) risk_level = 'critical';
        else if (maxT >= 38) risk_level = 'high';
        else if (maxT >= 33) risk_level = 'moderate';

        forecastDaily.push({
          date: new Date(data.daily.time[d] + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
          max_temp_c: maxT,
          min_temp_c: minT,
          avg_humidity_pct: 55,
          uv_index_max: uvMax,
          risk_level
        });
      }
    }

    const recordedAt = new Date().toISOString();

    const reading: EnvironmentalReading = {
      id: `reading-live-${Date.now()}`,
      location_id: locationId,
      temperature_c: tempC,
      relative_humidity_pct: humidityPct,
      feels_like_c: feelsLikeC,
      heat_index_c: heatIndexC,
      wet_bulb_c: wetBulbC,
      uv_index: currentUv,
      wind_speed_kmh: Number(current.wind_speed_10m?.toFixed(1) || '11.5'),
      weather_condition: mapWeatherCode(current.weather_code),
      data_source: 'open_meteo',
      recorded_at: recordedAt
    };

    const result: WeatherFetchResult = {
      reading,
      forecastHourly,
      forecastDaily,
      isLive: true,
      statusMessage: 'Live Open-Meteo Telemetry Connected (Asia/Kolkata)',
      lastUpdated: recordedAt
    };

    // Save to memory cache & persistent backup storage
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    try {
      localStorage.setItem(`${LAST_READING_STORAGE_PREFIX}${cacheKey}`, JSON.stringify(result));
    } catch {
      // Storage quota or sandboxed
    }

    return result;
  } catch (error) {
    // Attempt to recover from stored cached telemetry first
    try {
      const persisted = localStorage.getItem(`${LAST_READING_STORAGE_PREFIX}${cacheKey}`);
      if (persisted) {
        const parsed = JSON.parse(persisted) as WeatherFetchResult;
        return {
          ...parsed,
          isLive: false,
          statusMessage: `Telemetry Cached (${new Date(parsed.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        };
      }
    } catch {
      // fallback
    }

    // Graceful regional baseline fallback
    return getRegionalBaselineFallback(latitude, longitude, locationId, 'Live Open-Meteo API unreachable. Serving regional meteorological baseline.');
  }
}

export function getRegionalBaselineFallback(
  latitude: number, 
  longitude: number, 
  locationId: string, 
  reason: string
): WeatherFetchResult {
  const now = new Date();
  const hour = now.getHours();
  
  // Regional baseline temperature calibration based on official IMD climatological means
  const isSouthIndiaPlateau = latitude > 11.5 && latitude < 14.5; // Bengaluru / Mysuru
  const isNorthernPlains = latitude > 27.5 && latitude < 30.0;    // Delhi NCR
  const isWesternArid = latitude > 21.0 && latitude < 25.0;       // Gujarat / Rajasthan

  let baseTemp = 32.0;
  let baseHumidity = 52;

  if (isSouthIndiaPlateau) {
    if (hour >= 12 && hour <= 16) baseTemp = 34.5;
    else if (hour >= 9 && hour < 12) baseTemp = 31.0;
    else if (hour > 16 && hour <= 19) baseTemp = 30.5;
    else baseTemp = 24.0;
    baseHumidity = 50;
  } else if (isNorthernPlains || isWesternArid) {
    if (hour >= 12 && hour <= 16) baseTemp = 40.5;
    else if (hour >= 9 && hour < 12) baseTemp = 36.5;
    else if (hour > 16 && hour <= 19) baseTemp = 37.0;
    else baseTemp = 28.5;
    baseHumidity = 38;
  } else {
    if (hour >= 12 && hour <= 16) baseTemp = 35.5;
    else if (hour >= 9 && hour < 12) baseTemp = 32.5;
    else if (hour > 16 && hour <= 19) baseTemp = 32.0;
    else baseTemp = 26.0;
  }

  const tempC = Number(baseTemp.toFixed(1));
  const humidityPct = baseHumidity;
  const heatIndexC = calculateHeatIndex(tempC, humidityPct);
  const wetBulbC = calculateWetBulbEstimate(tempC, humidityPct);

  const forecastHourly = [];
  for (let i = 0; i < 12; i++) {
    const fHour = (hour + i) % 24;
    let fTemp = 28 + Math.sin((fHour - 6) / 18 * Math.PI) * 8;
    fTemp = Number(fTemp.toFixed(1));
    const fHum = Number((60 - (fTemp - 26) * 1.8).toFixed(1));
    forecastHourly.push({
      time: `${fHour.toString().padStart(2, '0')}:00`,
      temperature_c: fTemp,
      relative_humidity_pct: Math.max(25, Math.min(80, fHum)),
      heat_index_c: calculateHeatIndex(fTemp, fHum),
      uv_index: fHour >= 10 && fHour <= 15 ? 7.8 : 2.5
    });
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecastDaily = [];
  for (let d = 0; d < 7; d++) {
    const dDate = new Date();
    dDate.setDate(now.getDate() + d);
    const maxT = Number((tempC + 1.2 + (d % 2 === 0 ? 0.6 : -0.4)).toFixed(1));
    const minT = Number((tempC - 8.5).toFixed(1));
    const risk_level: 'low' | 'moderate' | 'high' | 'critical' = maxT >= 41 ? 'critical' : maxT >= 37 ? 'high' : 'moderate';
    forecastDaily.push({
      date: `${days[dDate.getDay()]}, ${dDate.getDate()} ${dDate.toLocaleString('default', { month: 'short' })}`,
      max_temp_c: maxT,
      min_temp_c: minT,
      avg_humidity_pct: baseHumidity,
      uv_index_max: 7.5,
      risk_level
    });
  }

  const reading: EnvironmentalReading = {
    id: `reading-baseline-${Date.now()}`,
    location_id: locationId,
    temperature_c: tempC,
    relative_humidity_pct: humidityPct,
    feels_like_c: Number((heatIndexC + 1.0).toFixed(1)),
    heat_index_c: heatIndexC,
    wet_bulb_c: wetBulbC,
    uv_index: hour >= 10 && hour <= 15 ? 7.5 : 2.0,
    wind_speed_kmh: 10.5,
    weather_condition: 'Regional Climatological Mean',
    data_source: 'simulated',
    recorded_at: now.toISOString()
  };

  return {
    reading,
    forecastHourly,
    forecastDaily,
    isLive: false,
    statusMessage: reason,
    lastUpdated: now.toISOString()
  };
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky / High Solar Insolation';
  if (code === 1 || code === 2) return 'Partly Cloudy / High UV Index';
  if (code === 3) return 'Overcast / High Humidity';
  if (code >= 45 && code <= 48) return 'Haze & Thermal Inversion Layer';
  if (code >= 51 && code <= 67) return 'Scattered Pre-Monsoon Showers';
  if (code >= 80) return 'Convective Heat Storm';
  return 'Clear / High Radiative Load';
}
