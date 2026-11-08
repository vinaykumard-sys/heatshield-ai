/**
 * HeatShield Action Engine - Mobile Shared Logic
 * Provides authoritative Heat Index, Wet-Bulb calculation, and plain-language safety actions.
 */

export interface HeatSafetyAnalysis {
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  headline: string;
  slogan: string;
  summary: string;
  peakHeatWindow: string;
  safeOutdoorWindow: string;
  hydrationTargetLiters: number;
  actions: {
    icon: string;
    title: string;
    desc: string;
    urgency: 'routine' | 'advisory' | 'priority' | 'urgent';
  }[];
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

  const HI_F =
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
 * Evaluates current environmental vitals and returns actionable heat defense guidance.
 */
export function evaluateHeatSafety(
  tempC: number,
  humidityPct: number,
  uvIndex: number = 8,
  windSpeedKmH: number = 10
): HeatSafetyAnalysis {
  const heatIndex = calculateHeatIndexC(tempC, humidityPct);
  const wetBulb = calculateWetBulbC(tempC, humidityPct);

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'LOW';
  let riskScore = 25;

  if (heatIndex >= 44 || wetBulb >= 29.5) {
    riskLevel = 'EXTREME';
    riskScore = Math.min(100, Math.round(85 + ((heatIndex - 44) / 8) * 15));
  } else if (heatIndex >= 40 || wetBulb >= 28.0) {
    riskLevel = 'HIGH';
    riskScore = Math.round(68 + ((heatIndex - 40) / 4) * 16);
  } else if (heatIndex >= 35) {
    riskLevel = 'MODERATE';
    riskScore = Math.round(45 + ((heatIndex - 35) / 5) * 22);
  } else {
    riskLevel = 'LOW';
    riskScore = Math.max(15, Math.round((heatIndex / 35) * 44));
  }

  if (riskLevel === 'EXTREME') {
    return {
      riskScore,
      riskLevel,
      headline: 'Severe Heatwave Hazard',
      slogan: 'STAY INDOORS • HYDRATE CONTINUOUSLY • SEEK SHADE',
      summary: `Heat index of ${heatIndex.toFixed(1)}°C with wet bulb ${wetBulb.toFixed(1)}°C is in the severe hazard band. High risk of heat stroke and rapid dehydration during midday.`,
      peakHeatWindow: '12:00 PM - 04:30 PM',
      safeOutdoorWindow: 'Before 09:30 AM or after 06:00 PM',
      hydrationTargetLiters: 4.5,
      actions: [
        {
          icon: 'water-outline',
          title: 'Immediate Oral Rehydration',
          desc: 'Drink 250ml water mixed with ORS or pinch of salt every 25 minutes.',
          urgency: 'urgent',
        },
        {
          icon: 'home-outline',
          title: 'Respite in Air-Cooled Shelter',
          desc: 'Visit a public cooling center if indoor room exceeds 35°C without fan.',
          urgency: 'urgent',
        },
        {
          icon: 'shield-alert-outline',
          title: 'Protect Seniors & Infants',
          desc: 'Check on elderly family members every 2 hours; apply cool wet compresses.',
          urgency: 'priority',
        },
        {
          icon: 'walk-outline',
          title: 'Use Canopy-Shaded Routes Only',
          desc: 'If travel is unavoidable, stick strictly to shaded boulevards.',
          urgency: 'priority',
        },
      ],
    };
  }

  if (riskLevel === 'HIGH') {
    return {
      riskScore,
      riskLevel,
      headline: 'Elevated Heat Strain',
      slogan: 'AVOID MIDDAY EXPOSURE • DRINK 3.5L FLUIDS',
      summary: `Feels like ${heatIndex.toFixed(1)}°C with UV index ${uvIndex}. Prolonged outdoor physical exertion can trigger heat exhaustion and fatigue.`,
      peakHeatWindow: '12:30 PM - 04:00 PM',
      safeOutdoorWindow: 'Before 10:30 AM or after 05:30 PM',
      hydrationTargetLiters: 3.5,
      actions: [
        {
          icon: 'water-outline',
          title: 'Hydration Schedule',
          desc: 'Drink water every 35-45 minutes. Carry an insulated bottle.',
          urgency: 'priority',
        },
        {
          icon: 'umbrella-outline',
          title: 'Sun Protection',
          desc: 'Wear wide-brim hat, sunglasses, and light cotton long sleeves.',
          urgency: 'priority',
        },
        {
          icon: 'pause-circle-outline',
          title: 'Take Frequent Shade Breaks',
          desc: 'Rest 10 minutes for every 40 minutes of outdoor movement.',
          urgency: 'advisory',
        },
      ],
    };
  }

  if (riskLevel === 'MODERATE') {
    return {
      riskScore,
      riskLevel,
      headline: 'Moderate Afternoon Heat',
      slogan: 'STAY REFRESHED • MONITOR HYDRATION',
      summary: `Feels like ${heatIndex.toFixed(1)}°C. Noticeable discomfort in unshaded direct sun, comfortable in tree-lined areas.`,
      peakHeatWindow: '01:00 PM - 03:30 PM',
      safeOutdoorWindow: 'All morning and late afternoon',
      hydrationTargetLiters: 2.8,
      actions: [
        {
          icon: 'water-outline',
          title: 'Carry Water Bottle',
          desc: 'Refill at public water kiosks along your commute.',
          urgency: 'advisory',
        },
        {
          icon: 'sunglasses',
          title: 'UV Shielding',
          desc: 'Apply sunscreen and prefer shaded sidewalks.',
          urgency: 'routine',
        },
      ],
    };
  }

  return {
    riskScore,
    riskLevel,
    headline: 'Benign Heat Conditions',
    slogan: 'NORMAL OUTDOOR CONDITIONS',
    summary: `Feels like ${heatIndex.toFixed(1)}°C. Thermal strain is low. Ideal window for commuting and outdoor tasks.`,
    peakHeatWindow: '01:30 PM - 03:00 PM',
    safeOutdoorWindow: 'Safe all day with standard hydration',
    hydrationTargetLiters: 2.2,
    actions: [
      {
        icon: 'checkmark-circle-outline',
        title: 'Safe Outdoor Windows',
        desc: 'Enjoy outdoor activities; carry regular drinking water.',
        urgency: 'routine',
      },
    ],
  };
}
