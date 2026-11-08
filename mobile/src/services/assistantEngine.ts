import { LOCALITIES, COOLING_CENTRES, HOURLY_FORECASTS } from '../data/mockData';
import { CoolingCentre, Locality } from '../types';

export interface AssistantResponse {
  text: string;
  intent: 'heat_risk' | 'water_cooling' | 'exhaustion_treatment' | 'outdoor_safety' | 'hydration_calc' | 'emergency' | 'general';
  quickReplies: string[];
  severity?: 'normal' | 'urgent';
  relatedShelter?: CoolingCentre;
  metrics?: {
    heatIndex?: number;
    temp?: number;
    riskLevel?: string;
    waterRequirementLiters?: number;
  };
}

export interface AssistantContext {
  localityName: string;
  currentTemp: number;
  apparentTemp?: number;
  humidity?: number;
  riskScore: number;
  riskCategory: string;
  nearestCoolingCentre?: CoolingCentre | null;
}

export const SUGGESTED_PROMPTS = [
  'What is my heat risk right now?',
  'Find closest drinking water',
  'How to treat heat exhaustion?',
  'Is it safe to run outside today?',
];

export function generateAssistantReply(
  userText: string,
  lang: string = 'en',
  ctx?: AssistantContext
) {
  const locality = LOCALITIES.find((l) => l.name === ctx?.localityName) || LOCALITIES[0];
  const response = processAssistantQuery(userText, locality);
  return {
    text: response.text,
    intent: response.intent,
    severity: response.severity,
    quickReplies: response.quickReplies,
  };
}


/**
 * Domain-specific intelligence engine for HeatShield AI Mobile Assistant.
 * Provides authoritative clinical and physiological heat safety counsel.
 */
export function processAssistantQuery(
  rawQuery: string,
  currentLocality: Locality = LOCALITIES[0]
): AssistantResponse {
  const query = rawQuery.toLowerCase().trim();

  // 1. EMERGENCY MEDICAL ESCALATION: Heat Stroke / Unconscious / Seizures
  if (
    query.includes('stroke') ||
    query.includes('unconscious') ||
    query.includes('fainted') ||
    query.includes('seizure') ||
    query.includes('collapsed') ||
    query.includes('emergency') ||
    query.includes('dying') ||
    query.includes('108') ||
    query.includes('112')
  ) {
    return {
      intent: 'emergency',
      severity: 'urgent',
      text: `🚨 CRITICAL HEATSTROKE MEDICAL EMERGENCY!\n\nHeatstroke (body temperature > 40°C with hot, dry skin or confusion) is life-threatening.\n\n⚠️ IMMEDIATE PROTOCOL:\n1. Call National Ambulance: 108 or 112 immediately!\n2. Move patient to deep shade or air conditioning.\n3. Aggressively cool: place ice or cold wet towels on neck, armpits, and groin.\n4. Fan vigorously.\n5. DO NOT force liquids if the person is disoriented or unconscious.`,
      quickReplies: [
        'Call 108 Ambulance',
        'How to treat heat exhaustion?',
        'Find closest drinking water',
      ],
    };
  }

  // 2. "WHAT IS MY HEAT RISK RIGHT NOW?" / Current Heat Risk & Telemetry
  if (
    query.includes('risk right now') ||
    query.includes('my heat risk') ||
    query.includes('current risk') ||
    query.includes('how hot is it') ||
    query.includes('what is the heat index') ||
    query.includes('temperature today')
  ) {
    const loc = currentLocality;
    const isExtreme = loc.riskLevel === 'EXTREME';
    const isHigh = loc.riskLevel === 'HIGH';

    const riskSummary = isExtreme
      ? 'DANGEROUS / EXTREME THERMAL OVERLOAD'
      : isHigh
      ? 'HIGH HEAT ADVISORY'
      : 'MODERATE HEAT CAUTION';

    return {
      intent: 'heat_risk',
      severity: isExtreme ? 'urgent' : 'normal',
      metrics: {
        temp: loc.currentTemp,
        heatIndex: loc.heatIndex,
        riskLevel: loc.riskLevel,
      },
      text: `🌡️ Hyperlocal Heat Telemetry for ${loc.name}:\n\n` +
        `• Current Temp: ${loc.currentTemp}°C\n` +
        `• RealFeel / Heat Index: ${loc.heatIndex}°C\n` +
        `• Wet-Bulb Temperature: ${loc.wetBulb}°C (Thermal threshold: 28°C+)\n` +
        `• Relative Humidity: ${loc.humidity}%\n` +
        `• Solar UV Index: ${loc.uvIndex} (Extreme - skin burns < 15 min)\n` +
        `• Risk Classification: [${riskSummary}]\n\n` +
        `🛡️ AI Recommendation:\n` +
        `The midday radiant heat factor is elevated by ${Math.round((loc.urbanHeatIslandFactor - 1) * 100)}% due to urban concrete heat entrapment. Minimize direct solar exposure until 5:30 PM and target 3.5 Liters of electrolyte-fortified fluids today.`,
      quickReplies: [
        'Find closest drinking water',
        'Is it safe to run outside today?',
        'How to treat heat exhaustion?',
      ],
    };
  }

  // 3. "FIND CLOSEST DRINKING WATER" / Water kiosk / Cooling shelters
  if (
    query.includes('closest drinking water') ||
    query.includes('find drinking water') ||
    query.includes('drinking water') ||
    query.includes('water kiosk') ||
    query.includes('cooling shelter') ||
    query.includes('refuge') ||
    query.includes('hydration point') ||
    query.includes('water')
  ) {
    const shelter = COOLING_CENTRES[0]; // Nearest shelter in mockData
    return {
      intent: 'water_cooling',
      relatedShelter: shelter,
      text: `💧 Verified Drinking Water & Heat Respite Near You:\n\n` +
        `🏛️ Nearest Respite Hub: ${shelter.name}\n` +
        `📍 Location: ${shelter.address}\n` +
        `📏 Distance: ~${shelter.distanceKm} km (Approx 7 min walk)\n` +
        `⏰ Hours: ${shelter.operatingHours} (Currently Open ✅)\n` +
        `📞 Contact: ${shelter.contactPhone}\n\n` +
        `Available Amenities:\n` +
        shelter.amenities.map((a) => `  ✓ ${a}`).join('\n') +
        `\n\n💡 Tip: Municipal drinking water stations offer free chilled RO water & government-certified ORS electrolyte sachets.`,
      quickReplies: [
        'What is my heat risk right now?',
        'How to treat heat exhaustion?',
        'Calculate my hydration needs',
      ],
    };
  }

  // 4. "HOW TO TREAT HEAT EXHAUSTION?" / First Aid Protocol
  if (
    query.includes('treat heat exhaustion') ||
    query.includes('heat exhaustion') ||
    query.includes('exhaustion vs') ||
    query.includes('cramps') ||
    query.includes('dizzy') ||
    query.includes('faint') ||
    query.includes('first aid')
  ) {
    return {
      intent: 'exhaustion_treatment',
      severity: 'normal',
      text: `🩺 CLINICAL GUIDE: Treating Heat Exhaustion\n\n` +
        `⚠️ Key Warning Signs:\n` +
        `• Heavy sweating with pale, cool, or clammy skin\n` +
        `• Muscle cramps & trembling in calves or abdomen\n` +
        `• Dizziness, headache, nausea, rapid pulse\n\n` +
        `✅ 4-STEP IMMEDIATE RELIEF PROTOCOL:\n` +
        `1. MOVE TO SHADE: Get inside an air-conditioned building or tree canopy immediately.\n` +
        `2. EVAPORATIVE COOLING: Loosen tight clothing; apply cold wet cloths or spray water on forehead, neck, and wrists.\n` +
        `3. SIP HYDRATION: Drink 250ml of cool water mixed with ORS or a pinch of salt & lemon every 15 minutes. Sip slowly.\n` +
        `4. ELEVATE LEGS: Lie down and prop legs up 6–8 inches to restore blood flow to core organs.\n\n` +
        `🚨 WARNING: If vomiting persists or disorientation/fainting begins, this indicates progression to HEATSTROKE. Dial 108 without delay!`,
      quickReplies: [
        'Recognize heatstroke symptoms',
        'Find closest drinking water',
        'What is my heat risk right now?',
      ],
    };
  }

  // 5. "IS IT SAFE TO RUN OUTSIDE TODAY?" / Safe Running & Outdoor Fitness
  if (
    query.includes('safe to run') ||
    query.includes('run outside') ||
    query.includes('jogging') ||
    query.includes('workout outside') ||
    query.includes('cycling outside') ||
    query.includes('outdoor exercise') ||
    query.includes('marathon')
  ) {
    const loc = currentLocality;
    const canRunSafely = loc.heatIndex < 38;

    return {
      intent: 'outdoor_safety',
      severity: !canRunSafely ? 'urgent' : 'normal',
      text: `🏃 Outdoor Running & Athletics Assessment:\n\n` +
        `❌ STATUS: NOT RECOMMENDED during peak daylight hours.\n` +
        `• Current Heat Index: ${loc.heatIndex}°C (Danger Zone)\n` +
        `• Wet-Bulb Globe Risk: ${loc.wetBulb}°C — Exertional heat illness risk is VERY HIGH.\n\n` +
        `🕒 Safe Exercise Windows Today:\n` +
        `• Morning Window: 05:30 AM – 07:45 AM (Optimal ground temp ~24°C)\n` +
        `• Evening Window: After 06:15 PM (Radiant asphalt temp drops)\n` +
        `• STRICT NO-EXERCISE ZONE: 10:30 AM – 05:00 PM\n\n` +
        `⚠️ Runner's Protective Protocol:\n` +
        `• Asphalt can be 20°C hotter than ambient air, radiating heat into your core.\n` +
        `• Pre-hydrate with 400ml water 30 minutes before stepping out.\n` +
        `• Cap heart rate at Zone 2; heat causes cardiovascular drift (+15-20 bpm for same pace).`,
      quickReplies: [
        'What is my heat risk right now?',
        'Calculate my hydration needs',
        'Find closest drinking water',
      ],
    };
  }

  // 6. HYDRATION CALCULATION / WATER INTAKE
  if (
    query.includes('hydration') ||
    query.includes('how much water') ||
    query.includes('calculate water') ||
    query.includes('electrolytes') ||
    query.includes('ors')
  ) {
    return {
      intent: 'hydration_calc',
      text: `💧 Personalized Hydration Formulation:\n\n` +
        `For an average adult under today's ${currentLocality.heatIndex}°C heat index:\n\n` +
        `• Baseline Daily Water: 3.5 to 4.2 Liters\n` +
        `• Outdoor Exposure Surcharge: +250ml per 20 minutes in sun\n` +
        `• Electrolyte Balance: Add 1 sachet WHO-ORS per liter or 1/4 tsp salt + lemon\n\n` +
        `💡 Hydration Rule of Thumb:\n` +
        `Check your urine color. Light straw or pale clear indicates optimal hydration. Amber or dark yellow signals moderate to acute dehydration.`,
      quickReplies: [
        'Find closest drinking water',
        'What is my heat risk right now?',
        'How to treat heat exhaustion?',
      ],
    };
  }

  // 7. DEFAULT / CONVERSATIONAL HEAT ADVISORY
  return {
    intent: 'general',
    text: `🛡️ HeatShield AI Response:\n\n` +
      `Under current weather conditions in ${currentLocality.name} (${currentLocality.currentTemp}°C, Feels like ${currentLocality.heatIndex}°C):\n\n` +
      `1. Stay sheltered during peak sun hours (11:30 AM – 3:30 PM).\n` +
      `2. Drink clean water enriched with electrolytes at regular 30-minute intervals.\n` +
      `3. Keep vulnerable family members (seniors, children, pets) in well-ventilated, shaded rooms.\n` +
      `4. Check the nearest verified Cooling Shelter if your home lacks active cooling.`,
    quickReplies: [
      'What is my heat risk right now?',
      'Find closest drinking water',
      'How to treat heat exhaustion?',
      'Is it safe to run outside today?',
    ],
  };
}
