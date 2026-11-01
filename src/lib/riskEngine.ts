import { 
  RiskCategory, 
  CheckinPriority, 
  ContributingFactors, 
  HeatRiskAssessment, 
  SupportedLanguage, 
  Resident 
} from '../types';

export interface RiskEngineInput {
  temperatureC: number;
  relativeHumidityPct: number;
  baselineVulnerabilityScore?: number; // 0-100 from location
  urbanHeatIslandFactor?: number;      // e.g. 1.0 - 1.6
  hourOfDay?: number;                  // 0 - 23
  isRecentTrendRising?: boolean;
}

export function calculateHeatIndex(tempC: number, humidityPct: number): number {
  // Convert Celsius to Fahrenheit for standard Steadman / Rothfusz formula
  const T = (tempC * 9/5) + 32;
  const RH = humidityPct;

  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));

  if (HI >= 80) {
    HI = -42.379 + 2.04901523 * T + 10.14333127 * RH
         - 0.22475541 * T * RH - 0.00683783 * T * T
         - 0.05481717 * RH * RH + 0.00122874 * T * T * RH
         + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;

    if (RH < 13 && T >= 80 && T <= 112) {
      const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      HI -= adjustment;
    } else if (RH > 85 && T >= 80 && T <= 87) {
      const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
      HI += adjustment;
    }
  }

  // Convert back to Celsius
  const hiC = (HI - 32) * 5/9;
  return Number(hiC.toFixed(1));
}

export function calculateWetBulbEstimate(tempC: number, humidityPct: number): number {
  // Stull (2011) formula for wet bulb temperature approximation
  const T = tempC;
  const RH = humidityPct;
  const Tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) - Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
  return Number(Tw.toFixed(1));
}

export function evaluateHeatRisk(
  input: RiskEngineInput, 
  locationId: string = 'loc-default',
  language: SupportedLanguage = 'en'
): HeatRiskAssessment {
  const {
    temperatureC,
    relativeHumidityPct,
    baselineVulnerabilityScore = 50,
    urbanHeatIslandFactor = 1.2,
    hourOfDay = new Date().getHours(),
    isRecentTrendRising = true
  } = input;

  const heatIndexC = calculateHeatIndex(temperatureC, relativeHumidityPct);

  // 1. Ambient Temperature Score (0 - 100)
  // IMD Heatwave baseline for Indian plains: >40C is severe, >45C critical
  let tempScore = 0;
  if (temperatureC < 30) tempScore = (temperatureC / 30) * 30;
  else if (temperatureC <= 38) tempScore = 30 + ((temperatureC - 30) / 8) * 35;
  else if (temperatureC <= 44) tempScore = 65 + ((temperatureC - 38) / 6) * 25;
  else tempScore = Math.min(100, 90 + ((temperatureC - 44) / 4) * 10);

  // 2. Humidity & Heat Index Score (0 - 100)
  let humidityScore = 0;
  if (heatIndexC < 32) humidityScore = 25;
  else if (heatIndexC <= 40) humidityScore = 25 + ((heatIndexC - 32) / 8) * 35;
  else if (heatIndexC <= 48) humidityScore = 60 + ((heatIndexC - 40) / 8) * 25;
  else humidityScore = Math.min(100, 85 + ((heatIndexC - 48) / 6) * 15);

  // 3. Diurnal Peak Factor (Peak danger between 11:30 and 16:30)
  let diurnalScore = 30;
  if (hourOfDay >= 11 && hourOfDay <= 16) {
    diurnalScore = 90;
  } else if ((hourOfDay >= 9 && hourOfDay < 11) || (hourOfDay > 16 && hourOfDay <= 19)) {
    diurnalScore = 60;
  } else {
    diurnalScore = 20; // Night-time recovery period
  }

  // 4. Urban Exposure & Built Environment (UHI)
  const urbanScore = Math.min(100, baselineVulnerabilityScore * (urbanHeatIslandFactor / 1.2));

  // Weighted aggregation
  const weights = {
    temp: 0.35,
    humidity: 0.25,
    vulnerability: 0.20,
    diurnal: 0.20
  };

  let rawRiskScore = (
    tempScore * weights.temp +
    humidityScore * weights.humidity +
    urbanScore * weights.vulnerability +
    diurnalScore * weights.diurnal
  );

  // Trend modifier
  if (isRecentTrendRising) {
    rawRiskScore += 3.5;
  }

  const finalRiskScore = Math.max(5, Math.min(99.5, Number(rawRiskScore.toFixed(1))));

  // Determine category & priority
  let category: RiskCategory = 'low';
  let priority: CheckinPriority = 'routine';

  if (finalRiskScore >= 80) {
    category = 'critical';
    priority = 'immediate';
  } else if (finalRiskScore >= 62) {
    category = 'high';
    priority = 'urgent';
  } else if (finalRiskScore >= 38) {
    category = 'moderate';
    priority = 'elevated';
  } else {
    category = 'low';
    priority = 'routine';
  }

  // Generate multilingual AI explanation
  const aiExplanation = generateExplanation(language, category, finalRiskScore, temperatureC, relativeHumidityPct, heatIndexC, urbanHeatIslandFactor);
  const preventiveActions = generatePreventiveActions(language, category);

  const contributingFactors: ContributingFactors = {
    ambient_temperature_score: Number(tempScore.toFixed(1)),
    humidity_heat_index_score: Number(humidityScore.toFixed(1)),
    urban_exposure_score: Number(urbanScore.toFixed(1)),
    diurnal_peak_score: Number(diurnalScore.toFixed(1)),
    vulnerability_baseline_score: Number(baselineVulnerabilityScore.toFixed(1)),
    weights
  };

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    location_id: locationId,
    risk_score: finalRiskScore,
    risk_category: category,
    contributing_factors: contributingFactors,
    ai_explanation: aiExplanation,
    preventive_actions: preventiveActions,
    checkin_priority: priority,
    confidence_score: 0.94,
    calculated_at: new Date().toISOString()
  };
}

function generateExplanation(
  lang: SupportedLanguage,
  category: RiskCategory,
  score: number,
  temp: number,
  humidity: number,
  heatIndex: number,
  uhiFactor: number
): string {
  const isHighUHI = uhiFactor >= 1.3;

  if (lang === 'hi') {
    if (category === 'critical') {
      return `गंभीर ताप जोखिम (स्कोर ${score}/100): उच्च परिवेशी तापमान (${temp}°C) और ${humidity}% आर्द्रता के कारण अनुभूत तापमान ${heatIndex}°C तक पहुँच गया है। ${isHighUHI ? 'घनी आबादी और टीन/कंक्रीट संरचनाओं के कारण स्थानीय प्रभाव और अधिक तीव्र है।' : ''} त्वरित सामुदायिक कल्याण जांच आवश्यक है।`;
    } else if (category === 'high') {
      return `उच्च ताप जोखिम (स्कोर ${score}/100): तापमान (${temp}°C) एवं उमस के मिश्रण से उच्च पर्यावरण तनाव बना हुआ है। संवेदनशील नागरिकों के लिए निवारक शीतलन एवं हाइड्रेशन आवश्यक है।`;
    } else if (category === 'moderate') {
      return `मध्यम ताप जोखिम (स्कोर ${score}/100): सामान्य से अधिक ताप दर्ज किया गया है (${temp}°C)। दोपहर के समय बाहरी गतिविधियों को सीमित करने की सलाह दी जाती है।`;
    } else {
      return `सामान्य / कम जोखिम (स्कोर ${score}/100): पर्यावरणीय परिस्थितियाँ सामान्य सीमा में हैं। नियमित निगरानी जारी रखें।`;
    }
  }

  if (lang === 'kn') {
    if (category === 'critical') {
      return `ತೀವ್ರ ಶಾಖದ ಅಪಾಯ (ಅಂಕ ${score}/100): ಅಧಿಕ ತಾಪಮಾನ (${temp}°C) ಮತ್ತು ${humidity}% ತೇವಾಂಶದಿಂದಾಗಿ ಹೀಟ್ ಇಂಡೆಕ್ಸ್ ${heatIndex}°C ತಲುಪಿದೆ. ${isHighUHI ? 'ಕಾಂಕ್ರೀಟ್ ಸಾಂದ್ರತೆಯಿಂದಾಗಿ ತಾಪ ಇನ್ನಷ್ಟು ಹೆಚ್ಚಿದೆ.' : ''} ತಕ್ಷಣವೇ ದುರ್ಬಲ ನಿವಾಸಿಗಳ ಕ್ಷೇಮ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.`;
    } else if (category === 'high') {
      return `ಹೆಚ್ಚಿನ ಶಾಖ ಅಪಾಯ (ಅಂಕ ${score}/100): ಪರಿಸರದಲ್ಲಿ ಶಾಖದ ಒತ್ತಡ ತೀವ್ರವಾಗಿದೆ. ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಹೊರಾಂಗಣ ಕಾರ್ಮಿಕರಿಗೆ ಮುನ್ನೆಚ್ಚರಿಕೆ ಅಗತ್ಯ.`;
    } else if (category === 'moderate') {
      return `ಮಧ್ಯಮ ಶಾಖ ಅಪಾಯ (ಅಂಕ ${score}/100): ತಾಪಮಾನ ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಹೆಚ್ಚಿದೆ (${temp}°C). ಮಧ್ಯಾಹ್ನ ನೆರಳಿನಲ್ಲಿರಲು ಸೂಚಿಸಲಾಗಿದೆ.`;
    } else {
      return `ಕಡಿಮೆ ಅಪಾಯ (ಅಂಕ ${score}/100): ಪ್ರಸ್ತುತ ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿಗಳು ನಿಯಂತ್ರಣದಲ್ಲಿವೆ.`;
    }
  }

  // Default English
  if (category === 'critical') {
    return `Critical Heat Risk detected (Score ${score}/100): Ambient temperature (${temp}°C) coupled with ${humidity}% humidity yields an effective heat index of ${heatIndex}°C. ${isHighUHI ? 'Elevated urban heat island multiplier detected in high-density settlement.' : ''} Immediate volunteer welfare check-ins and hydration dispatches recommended.`;
  } else if (category === 'high') {
    return `High Heat Risk classified (Score ${score}/100): Elevated thermal load from ${temp}°C temperatures and afternoon diurnal peak. High-vulnerability households (elderly, asbestos roofing) should receive priority contact.`;
  } else if (category === 'moderate') {
    return `Moderate Heat Risk (Score ${score}/100): Elevated temperatures (${temp}°C) observed. Outdoor activity during 12:00-16:00 should be minimized with proactive hydration reminders.`;
  } else {
    return `Low Environmental Risk (Score ${score}/100): Meteorological parameters are within safe baseline limits. Continue routine community observation.`;
  }
}

function generatePreventiveActions(lang: SupportedLanguage, category: RiskCategory): string[] {
  if (lang === 'hi') {
    if (category === 'critical' || category === 'high') {
      return [
        'दोपहर 11:30 से 4:30 के बीच सीधी धूप में बाहर निकलने से बचें',
        'पर्याप्त मात्रा में पानी, ओआरएस (ORS) और नींबू पानी पिएं',
        'हल्के, ढीले और सूती कपड़े पहनें',
        'अतिसंवेदनशील बुजुर्गों और बच्चों के कमरों में उचित वेंटिलेशन सुनिश्चित करें',
        'निकटतम सामुदायिक शीतलन केंद्र (Cooling Centre) का उपयोग करें'
      ];
    }
    return [
      'नियमित रूप से पानी पीते रहें',
      'छायादार स्थानों में रहें और सिर ढककर रखें',
      'कमरे को हवादार रखें'
    ];
  }

  if (lang === 'kn') {
    if (category === 'critical' || category === 'high') {
      return [
        'ಬೆಳಿಗ್ಗೆ 11:30 ರಿಂದ ಸಂಜೆ 4:30 ರವರೆಗೆ ಬಿಸಿಲಿನಲ್ಲಿ ಓಡಾಡುವುದನ್ನು ತಪ್ಪಿಸಿ',
        'ಸಾಕಷ್ಟು ನೀರು, ಒಆರ್‌ಎಸ್ (ORS) ಮತ್ತು ಮಜ್ಜಿಗೆ ಕುಡಿಯಿರಿ',
        'ತಿಳಿ ಬಣ್ಣದ ಹತ್ತಿ ಬಟ್ಟೆಗಳನ್ನು ಧರಿಸಿ',
        'ಹಿರಿಯ ನಾಗರಿಕರ ಕೋಣೆಗಳಲ್ಲಿ ಗಾಳಿಯಾಡುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ',
        'ಅಗತ್ಯವಿದ್ದಾಗ ಹತ್ತಿರದ ಸಮುದಾಯ ಕೂಲಿಂಗ್ ಕೇಂದ್ರಗಳಿಗೆ ತೆರಳಿ'
      ];
    }
    return [
      'ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯುತ್ತಿರಿ',
      'ನೆರಳಿನ ಜಾಗದಲ್ಲಿರಿ',
      'ಕೋಣೆಯನ್ನು ತಂಪಾಗಿಡಿ'
    ];
  }

  // English
  if (category === 'critical' || category === 'high') {
    return [
      'Avoid direct sun exposure between 11:30 AM and 4:30 PM',
      'Drink plenty of oral rehydration solutions (ORS), water, or buttermilk regularly',
      'Wear lightweight, loose-fitting cotton clothing and cover head outdoors',
      'Ensure passive cross-ventilation in rooms with asbestos or tin roofs',
      'Direct vulnerable community members to the nearest air-cooled community shelter'
    ];
  }
  return [
    'Maintain routine hydration throughout the day',
    'Keep living spaces adequately ventilated',
    'Stay informed of afternoon temperature spikes'
  ];
}

/**
 * Smart Check-in Prioritization Algorithm
 * Feature 3: Smart check-in prioritisation ranking pending check-ins
 * using risk level, time since last contact, and recorded vulnerability indicators.
 */
export function prioritizeResidents(residents: Resident[], riskScore: number): Resident[] {
  return [...residents].sort((a, b) => {
    const scoreA = computeResidentUrgencyScore(a, riskScore);
    const scoreB = computeResidentUrgencyScore(b, riskScore);
    return scoreB - scoreA;
  }).map((res, index) => ({
    ...res,
    calculated_priority_rank: index + 1
  }));
}

function computeResidentUrgencyScore(resident: Resident, baseRiskScore: number): number {
  let score = baseRiskScore;

  // Age factor
  if (resident.age_range === '75_plus') score += 20;
  else if (resident.age_range === '60_to_74') score += 12;
  else if (resident.age_range === 'under_5') score += 15;

  // Vulnerability indicators count
  const count = resident.vulnerability_indicators?.length || 0;
  score += count * 6;

  // Specific high risk indicators
  const indicatorsStr = (resident.vulnerability_indicators || []).join(' ').toLowerCase();
  if (indicatorsStr.includes('tin') || indicatorsStr.includes('asbestos')) score += 10;
  if (indicatorsStr.includes('respiratory') || indicatorsStr.includes('cardiac') || indicatorsStr.includes('asthma')) score += 12;
  if (indicatorsStr.includes('outdoor')) score += 8;
  if (indicatorsStr.includes('mobility') || indicatorsStr.includes('bedridden')) score += 14;

  // Time since last check-in
  if (!resident.last_welfare_checkin) {
    score += 25; // Never checked in
  } else {
    const diffHours = (Date.now() - new Date(resident.last_welfare_checkin).getTime()) / (1000 * 60 * 60);
    if (diffHours > 48) score += 20;
    else if (diffHours > 24) score += 10;
    else if (diffHours > 12) score += 4;
  }

  return score;
}
