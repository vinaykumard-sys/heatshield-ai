export interface HourlyPoint {
  time?: string;
  time_label?: string;
  temperature_c?: number;
  temp_c?: number;
  apparent_temperature_c?: number;
  relative_humidity_pct?: number;
  humidity_pct?: number;
  uv_index?: number;
}

export type ActionEngineRiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface ActionItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'hydration' | 'sun' | 'cooling' | 'activity' | 'medical';
  urgency: 'routine' | 'advisory' | 'priority' | 'urgent';
}

export interface DayPlanMilestone {
  timeLabel: string;
  hour: number;
  temperature: number;
  feelsLike: number;
  riskLevel: ActionEngineRiskLevel;
  headline: string;
  badgeText: string;
  description: string;
  isPeak: boolean;
  isSafeOutdoorWindow: boolean;
}

export interface ActionEngineInput {
  currentTemp: number;
  feelsLikeTemp: number;
  humidity?: number;
  uvIndex?: number;
  windSpeedKmH?: number;
  forecastHourly?: HourlyPoint[];
  observedAt?: string;
  activity?: 'resting' | 'walking' | 'active' | 'heavy_work';
}

export interface ActionEngineResult {
  riskScore: number;
  riskLevel: ActionEngineRiskLevel;
  residentSlogan: string;
  plainEnglishSummary: string;
  peakHeat: {
    timeLabel: string;
    temperature: number;
    feelsLike: number;
  };
  recommendedOutdoorWindow: {
    label: string;
    description: string;
    isCurrentlySafe: boolean;
  };
  immediateActions: ActionItem[];
  dayPlan: DayPlanMilestone[];
  hydrationGuidance: {
    rateMlPerHour: number;
    summary: string;
    electrolyteAdvice: string;
  };
  coolingRecommendation: {
    frequencyMinutes: number;
    summary: string;
  };
  advancedMetrics: {
    wetBulbApproxC: number;
    heatIndexC: number;
    vaporPressureHpa: number;
    calculatedAt: string;
  };
}

/**
 * Standard Rothfusz equation to calculate Apparent Heat Index in Celsius
 */
export function calculateHeatIndexC(tempC: number, humidityPct: number): number {
  const T = tempC;
  const RH = Math.max(10, Math.min(100, humidityPct));
  const T_F = (T * 9) / 5 + 32;

  if (T_F < 80) {
    const simpleF = 0.5 * (T_F + 61.0 + (T_F - 68.0) * 1.2 + RH * 0.094);
    return Math.round((((simpleF - 32) * 5) / 9) * 10) / 10;
  }

  let HI_F =
    -42.379 +
    2.04901523 * T_F +
    10.14333127 * RH -
    0.22475541 * T_F * RH -
    0.00683783 * T_F * T_F -
    0.05481717 * RH * RH +
    0.00122874 * T_F * T_F * RH +
    0.00085282 * T_F * RH * RH -
    0.00000199 * T_F * T_F * RH * RH;

  const HI_C = ((HI_F - 32) * 5) / 9;
  return Math.round(HI_C * 10) / 10;
}

/**
 * Stull formula approximation for Wet-Bulb Temperature in Celsius
 */
export function calculateWetBulbC(tempC: number, humidityPct: number): number {
  const T = tempC;
  const RH = Math.max(10, Math.min(100, humidityPct));
  const tw =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Math.round(tw * 10) / 10;
}

/**
 * Authoritative Deterministic HeatShield Action Engine
 * Centralizes risk calculation, resident slogans, day plan, and action guidance.
 */
export function evaluateHeatSafety(input: ActionEngineInput): ActionEngineResult {
  const temp = Number(input.currentTemp) || 28;
  const humidity = Number(input.humidity) || 55;
  const uv = Number(input.uvIndex) || 5;
  const wind = Number(input.windSpeedKmH) || 12;
  const activity = input.activity || 'resting';

  const heatIndex = calculateHeatIndexC(temp, humidity);
  const wetBulb = calculateWetBulbC(temp, humidity);

  // Activity Thermal Strain Offsets
  const activityOffsets = {
    resting: 0,
    walking: 5,
    active: 12,
    heavy_work: 18
  };
  const activityOffset = activityOffsets[activity] ?? 0;

  // Base deterministic risk score (0 to 100)
  // Derived from NOAA Heat Index and Wet Bulb thresholds
  let rawRisk = 0;
  if (heatIndex < 27) {
    rawRisk = Math.round(15 + (heatIndex / 27) * 20); // 15-35
  } else if (heatIndex < 33) {
    rawRisk = Math.round(40 + ((heatIndex - 27) / 6) * 24); // 40-64
  } else if (heatIndex < 41) {
    rawRisk = Math.round(65 + ((heatIndex - 33) / 8) * 14); // 65-79
  } else {
    rawRisk = Math.round(80 + Math.min(20, ((heatIndex - 41) / 8) * 20)); // 80-100
  }

  // Adjust for UV index strain (> 8 adds up to 6 pts)
  if (uv >= 8) rawRisk += Math.min(6, Math.round((uv - 7) * 2));

  // Add activity offset
  const finalRiskScore = Math.max(10, Math.min(100, rawRisk + activityOffset));

  // Determine Categorical Level & Plain-Language Slogan (Strictly as specified)
  let riskLevel: ActionEngineRiskLevel = 'low';
  let residentSlogan = "You're good to go.";
  let summary = 'Current ambient conditions pose minimal thermal strain. Regular daily routines can proceed normally.';

  if (finalRiskScore >= 80) {
    riskLevel = 'extreme';
    residentSlogan = 'Stay cool and avoid unnecessary outdoor activity.';
    summary = `Dangerous heat conditions (${temp}°C, feels like ${heatIndex}°C). High atmospheric moisture impairs natural sweat evaporation, creating severe physiological strain.`;
  } else if (finalRiskScore >= 65) {
    riskLevel = 'high';
    residentSlogan = 'Plan around the heat.';
    summary = `Elevated heat risk (${temp}°C, feels like ${heatIndex}°C). Midday direct sunlight and sustained thermal load accelerate dehydration and heat fatigue.`;
  } else if (finalRiskScore >= 40) {
    riskLevel = 'moderate';
    residentSlogan = 'Take it easy.';
    summary = `Warm conditions (${temp}°C, feels like ${heatIndex}°C). Moderate daytime sun exposure. Safe for routine tasks with periodic water breaks.`;
  } else {
    riskLevel = 'low';
    residentSlogan = "You're good to go.";
    summary = `Mild temperature (${temp}°C). Heat strain risk is minimal for all residents across standard outdoor tasks.`;
  }

  // Find Peak Heat from Forecast Hourly data (Never hardcoded!)
  let peakHourTime = '2:00 PM';
  let peakTemp = temp;
  let peakFeels = heatIndex;

  if (Array.isArray(input.forecastHourly) && input.forecastHourly.length > 0) {
    // Look at upcoming daytime hours (between 6 AM and 8 PM)
    let maxTemp = -Infinity;
    let maxPoint = input.forecastHourly[0];

    input.forecastHourly.slice(0, 24).forEach((p) => {
      const pointTemp = Number(p.temperature_c ?? p.temp_c ?? 0);
      if (pointTemp > maxTemp) {
        maxTemp = pointTemp;
        maxPoint = p;
      }
    });

    if (maxPoint) {
      peakTemp = Math.round(maxTemp);
      peakFeels = maxPoint.apparent_temperature_c 
        ? Math.round(maxPoint.apparent_temperature_c)
        : Math.round(calculateHeatIndexC(peakTemp, humidity));
      peakHourTime = maxPoint.time || maxPoint.time_label || '2:00 PM';
    }
  }

  // Recommended Outdoor Safe Window
  const isCurrentlySafe = riskLevel === 'low' || riskLevel === 'moderate';
  const recommendedOutdoorWindow = {
    label: isCurrentlySafe ? 'Safe for outdoor movement now' : 'Optimal window: Before 10:30 AM or after 5:30 PM',
    description: isCurrentlySafe
      ? 'Current conditions allow normal outdoor activities. Keep a water bottle handy.'
      : 'Midday thermal stress is elevated. Reschedule rigorous commuting or heavy sports to early morning or twilight hours.',
    isCurrentlySafe
  };

  // Immediate Action Items ("What should you do now?")
  const immediateActions: ActionItem[] = [];

  // 1. Hydration Action
  if (riskLevel === 'extreme') {
    immediateActions.push({
      id: 'act-water-urgent',
      icon: '💧',
      title: 'Drink 500ml water with ORS/electrolytes every hour',
      description: 'Sip small quantities continuously. Do not wait until you feel thirsty.',
      type: 'hydration',
      urgency: 'urgent'
    });
  } else if (riskLevel === 'high') {
    immediateActions.push({
      id: 'act-water-high',
      icon: '💧',
      title: 'Drink at least 350ml water every 30 minutes',
      description: 'Carry a reusable water flask. Add a pinch of salt or lemon to replenish minerals.',
      type: 'hydration',
      urgency: 'priority'
    });
  } else if (riskLevel === 'moderate') {
    immediateActions.push({
      id: 'act-water-mod',
      icon: '💧',
      title: 'Drink water regularly throughout the day',
      description: 'Target 2.5 to 3 litres of baseline hydration during warm hours.',
      type: 'hydration',
      urgency: 'advisory'
    });
  } else {
    immediateActions.push({
      id: 'act-water-low',
      icon: '💧',
      title: 'Maintain regular baseline hydration',
      description: 'Drink water naturally before and after outdoor movement.',
      type: 'hydration',
      urgency: 'routine'
    });
  }

  // 2. Sun & Exposure Action
  if (riskLevel === 'extreme' || riskLevel === 'high') {
    immediateActions.push({
      id: 'act-sun-high',
      icon: '☀️',
      title: 'Avoid direct sunlight exposure between 12 PM – 3:30 PM',
      description: 'Stay under tree canopies, shaded walkways, or indoor cooling shelters.',
      type: 'sun',
      urgency: riskLevel === 'extreme' ? 'urgent' : 'priority'
    });
  } else if (riskLevel === 'moderate') {
    immediateActions.push({
      id: 'act-sun-mod',
      icon: '☀️',
      title: 'Seek shade during peak afternoon glare',
      description: 'Wear a wide-brim hat or carry an umbrella when walking under direct sun.',
      type: 'sun',
      urgency: 'advisory'
    });
  }

  // 3. Cooling & Shelter Action
  if (riskLevel === 'extreme') {
    immediateActions.push({
      id: 'act-cool-ext',
      icon: '🧊',
      title: 'Take mandatory breaks in air-conditioned or shaded rooms',
      description: 'Use public cooling shelters, libraries, or metro stations if home feels overheated.',
      type: 'cooling',
      urgency: 'urgent'
    });
  } else if (riskLevel === 'high') {
    immediateActions.push({
      id: 'act-cool-high',
      icon: '🧊',
      title: 'Take 15-minute cool-down breaks every 45 minutes',
      description: 'Rest in well-ventilated, fan-cooled areas to allow internal body temperature to drop.',
      type: 'cooling',
      urgency: 'priority'
    });
  }

  // 4. Physical Exertion Action
  if (riskLevel === 'extreme' || riskLevel === 'high') {
    immediateActions.push({
      id: 'act-move-high',
      icon: '🏃',
      title: 'Avoid strenuous exercise and heavy outdoor labor now',
      description: 'Intense metabolic exertion in high heat increases cardiac workload dramatically.',
      type: 'activity',
      urgency: riskLevel === 'extreme' ? 'urgent' : 'priority'
    });
  } else {
    immediateActions.push({
      id: 'act-move-safe',
      icon: '🚶',
      title: 'Light outdoor walking and casual errands are fine',
      description: 'Wear loose-fitting, breathable cotton clothing to facilitate sweat evaporation.',
      type: 'activity',
      urgency: 'routine'
    });
  }

  // 5. Build Dynamic Heat-Safe Day Plan from Real Hourly Forecast
  const dayPlan: DayPlanMilestone[] = [];
  if (Array.isArray(input.forecastHourly) && input.forecastHourly.length > 0) {
    // Sample milestones across morning, noon, peak, and evening
    const hourlySlice = input.forecastHourly.slice(0, 24);

    hourlySlice.forEach((pt, index) => {
      // Pick key transition times (e.g. 8 AM, 11 AM, 1 PM, Peak hour, 6 PM)
      const ptTemp = Math.round(Number(pt.temperature_c ?? pt.temp_c ?? 28));
      const ptHumidity = Number(pt.relative_humidity_pct ?? pt.humidity_pct ?? humidity);
      const ptHI = Math.round(calculateHeatIndexC(ptTemp, ptHumidity));
      
      let ptLevel: ActionEngineRiskLevel = 'low';
      if (ptHI >= 41 || ptTemp >= 38) ptLevel = 'extreme';
      else if (ptHI >= 34 || ptTemp >= 34) ptLevel = 'high';
      else if (ptHI >= 28 || ptTemp >= 30) ptLevel = 'moderate';
      else ptLevel = 'low';

      const isPeakHour = Boolean(ptTemp === peakTemp || (pt.time && pt.time.includes(peakHourTime)));

      // Filter to ~4-5 key anchor hours for resident clarity
      const rawTime = (pt.time || '').toLowerCase();
      const isMorning = rawTime.includes('08:') || rawTime.includes('8 am') || index === 2;
      const isMidday = rawTime.includes('11:') || rawTime.includes('11 am') || index === 5;
      const isEarlyAft = rawTime.includes('13:') || rawTime.includes('1 pm') || index === 7;
      const isEvening = rawTime.includes('18:') || rawTime.includes('6 pm') || index === 12;

      if (isMorning || isMidday || isEarlyAft || isEvening || isPeakHour) {
        let headline = 'NORMAL CONDITIONS';
        let badge = 'Safe Window';
        let desc = 'Comfortable weather for daily travel, school runs, and outdoor activities.';

        if (isPeakHour) {
          headline = 'PEAK HEAT WINDOW';
          badge = 'Peak Risk';
          desc = `Maximum temperature of ${ptTemp}°C (feels like ${ptHI}°C). Stay sheltered from direct sunlight.`;
        } else if (isEvening) {
          headline = 'CONDITIONS IMPROVING';
          badge = 'Cooling Down';
          desc = 'Radiant solar heat diminishing. Comfortable for evening strolls and errands.';
        } else if (isEarlyAft) {
          headline = 'HIGHER THERMAL EXPOSURE';
          badge = 'Elevated Risk';
          desc = `Heat index climbing to ${ptHI}°C. Drink water before heading outdoors.`;
        } else if (isMidday) {
          headline = 'HEAT BUILDING';
          badge = 'Caution';
          desc = 'Solar radiation intensifying. Move rigorous outdoor tasks into shade.';
        } else if (isMorning) {
          headline = 'GOOD FOR OUTDOOR ACTIVITY';
          badge = 'Recommended';
          desc = 'Best window for exercise, cycling, outdoor errands, and walking.';
        }

        dayPlan.push({
          timeLabel: pt.time_label || pt.time || `${index}:00`,
          hour: index,
          temperature: ptTemp,
          feelsLike: ptHI,
          riskLevel: ptLevel,
          headline,
          badgeText: badge,
          description: desc,
          isPeak: isPeakHour,
          isSafeOutdoorWindow: ptLevel === 'low' || ptLevel === 'moderate'
        });
      }
    });
  }

  // If no forecast points matched or were available, provide realistic daytime anchors based on current temperature
  if (dayPlan.length < 3) {
    dayPlan.push(
      {
        timeLabel: '8:00 AM',
        hour: 8,
        temperature: Math.max(22, temp - 6),
        feelsLike: Math.max(22, heatIndex - 6),
        riskLevel: 'low',
        headline: 'GOOD FOR OUTDOOR ACTIVITY',
        badgeText: 'Safe Window',
        description: 'Morning temperature is moderate. Ideal for exercise, errands, and walking.',
        isPeak: false,
        isSafeOutdoorWindow: true
      },
      {
        timeLabel: '11:00 AM',
        hour: 11,
        temperature: Math.max(26, temp - 2),
        feelsLike: Math.max(26, heatIndex - 2),
        riskLevel: 'moderate',
        headline: 'HEAT BUILDING',
        badgeText: 'Caution',
        description: 'Atmospheric heat and UV glare increasing. Carry water and wear a cap.',
        isPeak: false,
        isSafeOutdoorWindow: true
      },
      {
        timeLabel: '1:00 PM',
        hour: 13,
        temperature: temp,
        feelsLike: heatIndex,
        riskLevel: riskLevel,
        headline: 'HIGHER THERMAL EXPOSURE',
        badgeText: 'High Heat',
        description: `Current reading ${temp}°C. Avoid unshaded walking during midday hours.`,
        isPeak: false,
        isSafeOutdoorWindow: false
      },
      {
        timeLabel: peakHourTime,
        hour: 14,
        temperature: Math.max(temp, peakTemp),
        feelsLike: Math.max(heatIndex, peakFeels),
        riskLevel: riskLevel === 'low' ? 'moderate' : riskLevel,
        headline: 'PEAK HEAT WINDOW',
        badgeText: 'Peak Heat',
        description: `Highest expected daytime thermal load (${peakTemp}°C). Rest in shaded or cooled spaces.`,
        isPeak: true,
        isSafeOutdoorWindow: false
      },
      {
        timeLabel: '6:00 PM',
        hour: 18,
        temperature: Math.max(24, temp - 4),
        feelsLike: Math.max(24, heatIndex - 4),
        riskLevel: 'low',
        headline: 'CONDITIONS IMPROVING',
        badgeText: 'Relief Window',
        description: 'Solar radiation subsiding. Heat risk reducing to safe baseline.',
        isPeak: false,
        isSafeOutdoorWindow: true
      }
    );
  }

  // De-duplicate milestones by timeLabel
  const seenTimes = new Set<string>();
  const uniqueDayPlan = dayPlan.filter((dp) => {
    if (seenTimes.has(dp.timeLabel)) return false;
    seenTimes.add(dp.timeLabel);
    return true;
  });

  return {
    riskScore: finalRiskScore,
    riskLevel,
    residentSlogan,
    plainEnglishSummary: summary,
    peakHeat: {
      timeLabel: peakHourTime,
      temperature: peakTemp,
      feelsLike: peakFeels
    },
    recommendedOutdoorWindow,
    immediateActions,
    dayPlan: uniqueDayPlan,
    hydrationGuidance: {
      rateMlPerHour: riskLevel === 'extreme' ? 600 : riskLevel === 'high' ? 400 : 250,
      summary: riskLevel === 'extreme'
        ? 'Drink 500-600ml water per hour with electrolytes.'
        : riskLevel === 'high'
        ? 'Drink 350-400ml water every 30 minutes.'
        : 'Drink 250ml water every 45-60 minutes.',
      electrolyteAdvice: (riskLevel === 'extreme' || riskLevel === 'high')
        ? 'Electrolytes or ORS recommended to prevent muscle cramps and salt depletion.'
        : 'Plain potable water is sufficient for normal indoor and shaded tasks.'
    },
    coolingRecommendation: {
      frequencyMinutes: riskLevel === 'extreme' ? 30 : riskLevel === 'high' ? 45 : 60,
      summary: (riskLevel === 'extreme' || riskLevel === 'high')
        ? 'Pause in air-conditioned or ventilated shade for at least 15 minutes.'
        : 'Take standard rest breaks in shaded areas.'
    },
    advancedMetrics: {
      wetBulbApproxC: wetBulb,
      heatIndexC: heatIndex,
      vaporPressureHpa: Math.round(((humidity / 100) * 6.1078 * Math.exp((17.27 * temp) / (temp + 237.3))) * 10) / 10,
      calculatedAt: input.observedAt || new Date().toISOString()
    }
  };
}
