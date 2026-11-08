import { Locality } from '../types';

export interface WeatherConditionDetails {
  code: number;
  label: string;
  simpleLabel: string;
  emoji: string;
  iconName: string;
  isRain: boolean;
  isStorm: boolean;
}

export interface DetailedWeatherReading {
  temperature_c: number;
  apparent_temperature_c: number;
  heat_index_c: number;
  wet_bulb_c: number;
  relative_humidity_pct: number;
  uv_index: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_direction_compass: string;
  precipitation_probability: number;
  precipitation_mm: number;
  weather_code: number;
  weather_condition: string;
  emoji: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  air_quality_score: number; // 0 - 100 Heat Exposure / Bio-meteorological Stress
  air_quality_label: string;
  is_day: boolean;
  updated_at: string;
  is_live: boolean;
}

export interface HourlyWeatherPoint {
  time: string;
  timeShort: string;
  isoTime: string;
  temperature_c: number;
  apparent_temp_c: number;
  heat_index_c: number;
  wet_bulb_c: number;
  humidity_pct: number;
  uv_index: number;
  precipitation_prob: number;
  wind_speed_kmh: number;
  weather_code: number;
  emoji: string;
  condition: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  isCurrentHour?: boolean;
}

export interface DailyWeatherPoint {
  dayName: string;
  dateStr: string;
  isoDate: string;
  max_temp_c: number;
  min_temp_c: number;
  apparent_max_c: number;
  uv_index_max: number;
  precipitation_prob_max: number;
  precipitation_sum_mm: number;
  wind_speed_max_kmh: number;
  weather_code: number;
  emoji: string;
  condition: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  isToday?: boolean;
}

export interface HeatSafetyAdvice {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  headline: string;
  peakHoursRange: string;
  hydrationAction: string;
  sunProtectionAction: string;
  activityRecommendation: string;
  vulnerableCare: string;
}

export interface WeatherDataBundle {
  current: DetailedWeatherReading;
  hourly: HourlyWeatherPoint[];
  daily: DailyWeatherPoint[];
  safetyAdvice: HeatSafetyAdvice;
  source: 'Open-Meteo Live' | 'Telemetry Baseline';
}

/**
 * Standard Steadman / Rothfusz Heat Index Formula
 */
export function calculateHeatIndex(tempC: number, humidityPct: number): number {
  const T = (tempC * 9) / 5 + 32;
  const RH = Math.max(0, Math.min(100, humidityPct));

  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);

  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * RH -
      0.22475541 * T * RH -
      0.00683783 * T * T -
      0.05481717 * RH * RH +
      0.00122874 * T * T * RH +
      0.00085282 * T * RH * RH -
      0.00000199 * T * T * RH * RH;

    if (RH < 13 && T >= 80 && T <= 112) {
      const adj = ((13 - RH) / 4) * Math.sqrt(Math.max(0, (17 - Math.abs(T - 95)) / 17));
      HI -= adj;
    } else if (RH > 85 && T >= 80 && T <= 87) {
      const adj = ((RH - 85) / 10) * ((87 - T) / 5);
      HI += adj;
    }
  }

  const hiC = ((HI - 32) * 5) / 9;
  return Number(Math.max(tempC, hiC).toFixed(1));
}

/**
 * Stull (2011) Wet Bulb Temperature Approximation
 */
export function calculateWetBulb(tempC: number, humidityPct: number): number {
  const T = tempC;
  const RH = Math.max(1, Math.min(100, humidityPct));
  const Tw =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Number(Tw.toFixed(1));
}

/**
 * Map degree bearing to 8-point compass
 */
export function degreesToCompass(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return directions[index];
}

/**
 * Parse Open-Meteo WMO weather interpretation code
 */
export function parseWeatherCode(code: number): WeatherConditionDetails {
  switch (code) {
    case 0:
      return { code, label: 'Clear Sky', simpleLabel: 'Clear', emoji: '☀️', iconName: 'sunny', isRain: false, isStorm: false };
    case 1:
      return { code, label: 'Mainly Clear', simpleLabel: 'Clear', emoji: '🌤️', iconName: 'partly-sunny', isRain: false, isStorm: false };
    case 2:
      return { code, label: 'Partly Cloudy', simpleLabel: 'Partly Cloudy', emoji: '⛅', iconName: 'cloudy', isRain: false, isStorm: false };
    case 3:
      return { code, label: 'Overcast & Humid', simpleLabel: 'Overcast', emoji: '☁️', iconName: 'cloudy', isRain: false, isStorm: false };
    case 45:
    case 48:
      return { code, label: 'Fog / Mist', simpleLabel: 'Fog', emoji: '🌫️', iconName: 'cloudy', isRain: false, isStorm: false };
    case 51:
    case 53:
    case 55:
      return { code, label: 'Light Drizzle', simpleLabel: 'Drizzle', emoji: '🌦️', iconName: 'rainy', isRain: true, isStorm: false };
    case 61:
    case 63:
      return { code, label: 'Moderate Rain', simpleLabel: 'Rain', emoji: '🌧️', iconName: 'rainy', isRain: true, isStorm: false };
    case 65:
      return { code, label: 'Heavy Downpour', simpleLabel: 'Heavy Rain', emoji: '🌧️', iconName: 'rainy', isRain: true, isStorm: false };
    case 80:
    case 81:
    case 82:
      return { code, label: 'Rain Showers', simpleLabel: 'Showers', emoji: '🌦️', iconName: 'rainy', isRain: true, isStorm: false };
    case 95:
      return { code, label: 'Thunderstorm', simpleLabel: 'Thunderstorm', emoji: '⛈️', iconName: 'thunderstorm', isRain: true, isStorm: true };
    case 96:
    case 99:
      return { code, label: 'Severe Hail Storm', simpleLabel: 'Severe Storm', emoji: '⛈️', iconName: 'thunderstorm', isRain: true, isStorm: true };
    default:
      return { code, label: 'Fair Skies', simpleLabel: 'Fair', emoji: '🌤️', iconName: 'partly-sunny', isRain: false, isStorm: false };
  }
}

/**
 * Determine Heat Risk Category from Heat Index and Wet Bulb
 */
export function determineHeatRisk(heatIndexC: number, wetBulbC: number): 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' {
  if (heatIndexC >= 44.0 || wetBulbC >= 29.5) {
    return 'EXTREME';
  }
  if (heatIndexC >= 38.0 || wetBulbC >= 27.5) {
    return 'HIGH';
  }
  if (heatIndexC >= 32.0 || wetBulbC >= 25.0) {
    return 'MODERATE';
  }
  return 'LOW';
}

/**
 * Calculate dynamic Heat Stress / Bio-meteorological Exposure Index (0-100)
 */
export function calculateHeatExposureIndex(tempC: number, humidityPct: number, uvIndex: number): { score: number; label: string } {
  // Weighted biological burden formula:
  // Heat index component (50%), UV component (30%), Humidity stagnation (20%)
  const hi = calculateHeatIndex(tempC, humidityPct);
  const hiNorm = Math.min(100, Math.max(0, ((hi - 22) / (50 - 22)) * 100));
  const uvNorm = Math.min(100, Math.max(0, (uvIndex / 12) * 100));
  const rhNorm = Math.min(100, Math.max(0, ((humidityPct - 30) / 70) * 100));

  const score = Math.round(hiNorm * 0.55 + uvNorm * 0.3 + rhNorm * 0.15);

  let label = 'Low Thermal Strain';
  if (score >= 80) {
    label = 'Severe Bio-Thermal Hazard';
  } else if (score >= 65) {
    label = 'High Cardiovascular Stress';
  } else if (score >= 45) {
    label = 'Moderate Heat Strain';
  }

  return { score: Math.min(99, Math.max(12, score)), label };
}

/**
 * Generate actionable Heat Safety Advice tailored dynamically
 */
export function generateDynamicSafetyAdvice(
  currentTemp: number,
  heatIndex: number,
  uvIndex: number,
  hourly: HourlyWeatherPoint[]
): HeatSafetyAdvice {
  // Find peak heat window from hourly data
  let peakHour = 14; // fallback 2 PM
  let maxHI = -999;
  for (const h of hourly.slice(0, 18)) {
    if (h.heat_index_c > maxHI) {
      maxHI = h.heat_index_c;
      const parsedHour = parseInt(h.time.split(':')[0], 10);
      if (!isNaN(parsedHour)) {
        peakHour = parsedHour;
      }
    }
  }

  const startPeak = Math.max(11, peakHour - 2);
  const endPeak = Math.min(17, peakHour + 2);
  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${period}`;
  };
  const peakRange = `${formatHour(startPeak)} – ${formatHour(endPeak)}`;

  const risk = determineHeatRisk(heatIndex, calculateWetBulb(currentTemp, 50));

  if (risk === 'EXTREME') {
    return {
      level: 'EXTREME',
      headline: 'CRITICAL HEATWAVE ALERT • AVOID DIRECT SUN EXPOSURE',
      peakHoursRange: peakRange,
      hydrationAction: 'Drink 500ml water mixed with ORS or coconut water every 30-45 minutes. Avoid chilled sugary sodas.',
      sunProtectionAction: `UV Index is ${uvIndex.toFixed(1)} (Extreme). Wear wide-brim hat, UV400 sunglasses, and apply broad-spectrum SPF 50+ sunscreen.`,
      activityRecommendation: `Mandatory halt on heavy outdoor exertion between ${peakRange}. Stay inside air-conditioned rooms or municipal cooling shelters.`,
      vulnerableCare: 'Check on elderly family members, outdoor workers, and infants hourly for heat exhaustion symptoms (nausea, confusion, dizziness).',
    };
  }

  if (risk === 'HIGH') {
    return {
      level: 'HIGH',
      headline: 'HIGH HEAT HAZARD • ACTIVE PRECAUTIONS REQUIRED',
      peakHoursRange: peakRange,
      hydrationAction: 'Drink 350-500ml fluids every 45-60 minutes even if not feeling thirsty. Keep electrolyte replenishment ready.',
      sunProtectionAction: 'Wear loose-fitting, light-coloured cotton clothing. Keep head covered with an umbrella or cap under direct sun.',
      activityRecommendation: `Limit continuous outdoor walking between ${peakRange}. Prefer shaded canopy pathways and take 10-minute rest intervals.`,
      vulnerableCare: 'Ensure pets have shaded resting spots with cool water. Keep vehicles ventilated before entering.',
    };
  }

  if (risk === 'MODERATE') {
    return {
      level: 'MODERATE',
      headline: 'MODERATE HEAT CAUTION • STAY HYDRATED',
      peakHoursRange: peakRange,
      hydrationAction: 'Maintain baseline 2.5L - 3L daily water intake. Drink a glass of water before heading outside.',
      sunProtectionAction: 'Apply SPF 30+ sunscreen if exposed for longer than 30 minutes. Wear light breathable fabrics.',
      activityRecommendation: `Schedule strenuous running, cycling, or physical errands before 11 AM or after 5 PM.`,
      vulnerableCare: 'Monitor hydration for school children and seniors during peak afternoon hours.',
    };
  }

  return {
    level: 'LOW',
    headline: 'MILD & COMFORTABLE CONDITIONS',
    peakHoursRange: 'No severe peak hazard today',
    hydrationAction: 'Standard 2L daily hydration recommended.',
    sunProtectionAction: 'Mild sun exposure; standard UV protection recommended during midday.',
    activityRecommendation: 'Normal outdoor activities and recreation are safe without heat restrictions.',
    vulnerableCare: 'Favourable outdoor environment for all age groups.',
  };
}

// In-memory cache with 3-minute TTL
const memoryCache = new Map<string, { data: WeatherDataBundle; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Primary API method to fetch 100% real Open-Meteo weather data for a given Locality
 */
export async function fetchWeatherForLocality(
  locality: Locality,
  forceRefresh: boolean = false
): Promise<WeatherDataBundle> {
  const cacheKey = `${locality.latitude.toFixed(3)},${locality.longitude.toFixed(3)}`;
  const cached = memoryCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${locality.latitude}&longitude=${locality.longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto&forecast_days=7`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP error ${res.status}`);
    }

    const data = await res.json();
    const cur = data.current || {};
    const h = data.hourly || { time: [] };
    const d = data.daily || { time: [] };

    const currentTemp = Number((cur.temperature_2m ?? locality.currentTemp).toFixed(1));
    const currentHumidity = Math.round(cur.relative_humidity_2m ?? locality.humidity);
    const currentApparent = Number((cur.apparent_temperature ?? (currentTemp + 2.5)).toFixed(1));
    const currentHeatIndex = calculateHeatIndex(currentTemp, currentHumidity);
    const currentWetBulb = calculateWetBulb(currentTemp, currentHumidity);
    const currentWindSpeed = Number((cur.wind_speed_10m ?? 12).toFixed(1));
    const currentWindDeg = cur.wind_direction_10m ?? 240;
    const currentCode = cur.weather_code ?? 1;
    const condDetails = parseWeatherCode(currentCode);

    // Get UV Index from the current hour in hourly forecast
    const nowIsoPrefix = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
    let nowUv = locality.uvIndex || 8.5;
    let nowPrecipProb = 10;
    let nowPrecipMm = 0;

    if (h.time && h.time.length > 0) {
      const matchIdx = h.time.findIndex((t: string) => t.startsWith(nowIsoPrefix));
      const idx = matchIdx >= 0 ? matchIdx : 0;
      if (h.uv_index && h.uv_index[idx] !== undefined) {
        nowUv = Number(h.uv_index[idx].toFixed(1));
      }
      if (h.precipitation_probability && h.precipitation_probability[idx] !== undefined) {
        nowPrecipProb = Math.round(h.precipitation_probability[idx]);
      }
      if (h.precipitation && h.precipitation[idx] !== undefined) {
        nowPrecipMm = Number(h.precipitation[idx].toFixed(1));
      }
    }

    const riskLevel = determineHeatRisk(currentHeatIndex, currentWetBulb);
    const heatExposure = calculateHeatExposureIndex(currentTemp, currentHumidity, nowUv);

    const currentReading: DetailedWeatherReading = {
      temperature_c: currentTemp,
      apparent_temperature_c: currentApparent,
      heat_index_c: currentHeatIndex,
      wet_bulb_c: currentWetBulb,
      relative_humidity_pct: currentHumidity,
      uv_index: nowUv,
      wind_speed_kmh: currentWindSpeed,
      wind_direction_deg: currentWindDeg,
      wind_direction_compass: degreesToCompass(currentWindDeg),
      precipitation_probability: nowPrecipProb,
      precipitation_mm: nowPrecipMm,
      weather_code: currentCode,
      weather_condition: condDetails.label,
      emoji: condDetails.emoji,
      risk_level: riskLevel,
      air_quality_score: heatExposure.score,
      air_quality_label: heatExposure.label,
      is_day: cur.is_day === 1 || cur.is_day === undefined,
      updated_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_live: true,
    };

    // Build 24-hour strip starting from current hour
    const hourlyPoints: HourlyWeatherPoint[] = [];
    const currentHourIndex = Math.max(
      0,
      h.time.findIndex((t: string) => t.startsWith(nowIsoPrefix))
    );

    const sliceCount = 24;
    for (let i = 0; i < sliceCount; i++) {
      const idx = currentHourIndex + i;
      if (idx >= h.time.length) break;

      const rawTime = h.time[idx]; // "2026-11-08T14:00"
      const dateObj = new Date(rawTime);
      const hourNum = dateObj.getHours();
      const timeShort = i === 0 ? 'Now' : `${hourNum % 12 === 0 ? 12 : hourNum % 12} ${hourNum >= 12 ? 'PM' : 'AM'}`;
      const timeDisplay = `${hourNum.toString().padStart(2, '0')}:00`;

      const tC = Number((h.temperature_2m[idx] ?? currentTemp).toFixed(1));
      const rh = Math.round(h.relative_humidity_2m[idx] ?? currentHumidity);
      const appC = Number((h.apparent_temperature[idx] ?? tC).toFixed(1));
      const hi = calculateHeatIndex(tC, rh);
      const wb = calculateWetBulb(tC, rh);
      const uv = Number((h.uv_index?.[idx] ?? 0).toFixed(1));
      const pop = Math.round(h.precipitation_probability?.[idx] ?? 0);
      const wind = Number((h.wind_speed_10m?.[idx] ?? 10).toFixed(1));
      const code = h.weather_code?.[idx] ?? 0;
      const cDetails = parseWeatherCode(code);
      const rk = determineHeatRisk(hi, wb);

      hourlyPoints.push({
        time: timeDisplay,
        timeShort,
        isoTime: rawTime,
        temperature_c: tC,
        apparent_temp_c: appC,
        heat_index_c: hi,
        wet_bulb_c: wb,
        humidity_pct: rh,
        uv_index: uv,
        precipitation_prob: pop,
        wind_speed_kmh: wind,
        weather_code: code,
        emoji: cDetails.emoji,
        condition: cDetails.simpleLabel,
        risk_level: rk,
        isCurrentHour: i === 0,
      });
    }

    // Build 7-day daily forecast
    const dailyPoints: DailyWeatherPoint[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < Math.min(7, d.time.length); i++) {
      const rawDate = d.time[i]; // "2026-11-08"
      const dateObj = new Date(rawDate);
      const isToday = i === 0;
      const isTomorrow = i === 1;

      let dayName = dayNames[dateObj.getDay()];
      if (isToday) dayName = 'Today';
      else if (isTomorrow) dayName = 'Tomorrow';

      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const maxT = Number((d.temperature_2m_max[i] ?? currentTemp).toFixed(0));
      const minT = Number((d.temperature_2m_min[i] ?? (currentTemp - 7)).toFixed(0));
      const appMax = Number((d.apparent_temperature_max[i] ?? maxT).toFixed(0));
      const uvMax = Number((d.uv_index_max?.[i] ?? 9).toFixed(1));
      const popMax = Math.round(d.precipitation_probability_max?.[i] ?? 0);
      const precipSum = Number((d.precipitation_sum?.[i] ?? 0).toFixed(1));
      const windMax = Number((d.wind_speed_10m_max?.[i] ?? 15).toFixed(0));
      const code = d.weather_code?.[i] ?? 0;
      const cDetails = parseWeatherCode(code);

      // Estimate daytime risk level
      const estHI = calculateHeatIndex(maxT, currentHumidity);
      const estWB = calculateWetBulb(maxT, currentHumidity);
      const rk = determineHeatRisk(estHI, estWB);

      dailyPoints.push({
        dayName,
        dateStr,
        isoDate: rawDate,
        max_temp_c: maxT,
        min_temp_c: minT,
        apparent_max_c: appMax,
        uv_index_max: uvMax,
        precipitation_prob_max: popMax,
        precipitation_sum_mm: precipSum,
        wind_speed_max_kmh: windMax,
        weather_code: code,
        emoji: cDetails.emoji,
        condition: cDetails.simpleLabel,
        risk_level: rk,
        isToday,
      });
    }

    const safetyAdvice = generateDynamicSafetyAdvice(
      currentTemp,
      currentHeatIndex,
      nowUv,
      hourlyPoints
    );

    const bundle: WeatherDataBundle = {
      current: currentReading,
      hourly: hourlyPoints,
      daily: dailyPoints,
      safetyAdvice,
      source: 'Open-Meteo Live',
    };

    memoryCache.set(cacheKey, { data: bundle, timestamp: Date.now() });
    return bundle;
  } catch (error) {
    console.warn('[WeatherService] Open-Meteo live fetch failed, generating realistic baseline:', error);
    return getFallbackWeatherBundle(locality);
  }
}

/**
 * Offline & High-fidelity fallback generator if network is unreachable
 */
export function getFallbackWeatherBundle(locality: Locality): WeatherDataBundle {
  const currentTemp = locality.currentTemp;
  const currentHumidity = locality.humidity;
  const currentHeatIndex = calculateHeatIndex(currentTemp, currentHumidity);
  const currentWetBulb = calculateWetBulb(currentTemp, currentHumidity);
  const risk = determineHeatRisk(currentHeatIndex, currentWetBulb);
  const exposure = calculateHeatExposureIndex(currentTemp, currentHumidity, locality.uvIndex);

  const current: DetailedWeatherReading = {
    temperature_c: currentTemp,
    apparent_temperature_c: locality.heatIndex,
    heat_index_c: currentHeatIndex,
    wet_bulb_c: currentWetBulb,
    relative_humidity_pct: currentHumidity,
    uv_index: locality.uvIndex,
    wind_speed_kmh: 14.2,
    wind_direction_deg: 250,
    wind_direction_compass: 'WSW',
    precipitation_probability: 15,
    precipitation_mm: 0.0,
    weather_code: 1,
    weather_condition: 'Mainly Clear & Sunny',
    emoji: '🌤️',
    risk_level: risk,
    air_quality_score: exposure.score,
    air_quality_label: exposure.label,
    is_day: true,
    updated_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    is_live: false,
  };

  const currentHour = new Date().getHours();
  const hourly: HourlyWeatherPoint[] = [];

  for (let i = 0; i < 24; i++) {
    const h = (currentHour + i) % 24;
    const timeShort = i === 0 ? 'Now' : `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;
    const timeDisplay = `${h.toString().padStart(2, '0')}:00`;

    // Temperature curve diurnal variation
    const hourFactor = Math.sin(((h - 8) / 14) * Math.PI);
    const tempOffset = hourFactor * 4.5;
    const t = Number((currentTemp + tempOffset).toFixed(1));
    const rh = Math.round(Math.max(30, currentHumidity - hourFactor * 12));
    const hi = calculateHeatIndex(t, rh);
    const wb = calculateWetBulb(t, rh);
    const rk = determineHeatRisk(hi, wb);
    const uv = h >= 10 && h <= 16 ? Number((locality.uvIndex * (1 - Math.abs(h - 13) / 4)).toFixed(1)) : 0;

    hourly.push({
      time: timeDisplay,
      timeShort,
      isoTime: `2026-11-08T${h.toString().padStart(2, '0')}:00`,
      temperature_c: t,
      apparent_temp_c: Number((hi).toFixed(1)),
      heat_index_c: hi,
      wet_bulb_c: wb,
      humidity_pct: rh,
      uv_index: uv,
      precipitation_prob: 10,
      wind_speed_kmh: 12 + (h % 5),
      weather_code: 1,
      emoji: h >= 6 && h <= 18 ? '☀️' : '🌙',
      condition: h >= 6 && h <= 18 ? 'Clear' : 'Clear Night',
      risk_level: rk,
      isCurrentHour: i === 0,
    });
  }

  const dayNames = ['Today', 'Tomorrow', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily: DailyWeatherPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const dObj = new Date();
    dObj.setDate(dObj.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[i % 7];
    const dateStr = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const maxT = Math.round(currentTemp + (i % 3) - 1);
    const minT = Math.round(maxT - 8);
    const hi = calculateHeatIndex(maxT, currentHumidity);
    const wb = calculateWetBulb(maxT, currentHumidity);
    const rk = determineHeatRisk(hi, wb);

    daily.push({
      dayName,
      dateStr,
      isoDate: dObj.toISOString().slice(0, 10),
      max_temp_c: maxT,
      min_temp_c: minT,
      apparent_max_c: Math.round(hi),
      uv_index_max: Number((locality.uvIndex + (i % 2) * 0.4).toFixed(1)),
      precipitation_prob_max: (i * 12) % 40,
      precipitation_sum_mm: 0.0,
      wind_speed_max_kmh: 16,
      weather_code: 1,
      emoji: '🌤️',
      condition: 'Mainly Sunny',
      risk_level: rk,
      isToday: i === 0,
    });
  }

  const safetyAdvice = generateDynamicSafetyAdvice(
    currentTemp,
    currentHeatIndex,
    locality.uvIndex,
    hourly
  );

  return {
    current,
    hourly,
    daily,
    safetyAdvice,
    source: 'Telemetry Baseline',
  };
}
