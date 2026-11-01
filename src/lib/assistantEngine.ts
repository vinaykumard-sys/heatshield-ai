import { SupportedLanguage, AssistantMessage, AssistantSuggestedPrompt, CoolingCentre, HeatForecast } from '../types';
import { mockDb } from './mockDb';

export interface AssistantContext {
  localityName: string;
  currentTemp: number;
  apparentTemp?: number;
  humidity?: number;
  riskScore: number;
  riskCategory: string;
  nearestCoolingCentre?: CoolingCentre | null;
  forecast24h?: HeatForecast | null;
}

export const SUGGESTED_PROMPTS: AssistantSuggestedPrompt[] = [
  // English
  { id: 'en-1', text: 'What is the current heat risk in my area?', language: 'en', category: 'heat_risk' },
  { id: 'en-2', text: 'What is the 24-hour heatwave forecast?', language: 'en', category: 'forecast' },
  { id: 'en-3', text: 'Where is the nearest verified cooling centre?', language: 'en', category: 'cooling_centre' },
  { id: 'en-4', text: 'What are heatstroke symptoms and first-aid steps?', language: 'en', category: 'safety' },
  { id: 'en-5', text: 'How should I protect elderly family members today?', language: 'en', category: 'welfare' },

  // Hindi
  { id: 'hi-1', text: 'मेरे इलाके में अभी गर्मी का जोखिम क्या है?', language: 'hi', category: 'heat_risk' },
  { id: 'hi-2', text: 'अगले 24 घंटों में गर्मी का क्या पूर्वानुमान है?', language: 'hi', category: 'forecast' },
  { id: 'hi-3', text: 'सबसे नजदीकी कूलिंग सेंटर (शीतल आश्रय) कहाँ है?', language: 'hi', category: 'cooling_centre' },
  { id: 'hi-4', text: 'लू (हीटस्ट्रोक) के लक्षण और आपातकालीन प्राथमिक उपचार क्या हैं?', language: 'hi', category: 'safety' },
  { id: 'hi-5', text: 'आज बुजुर्गों और बच्चों को गर्मी से कैसे बचाएं?', language: 'hi', category: 'welfare' },

  // Kannada
  { id: 'kn-1', text: 'ನನ್ನ ಪ್ರದೇಶದಲ್ಲಿ ಪ್ರಸ್ತುತ ಶಾಖದ ಅಪಾಯ ಎಷ್ಟಿದೆ?', language: 'kn', category: 'heat_risk' },
  { id: 'kn-2', text: 'ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಶಾಖದ ಮುನ್ಸೂಚನೆ ಏನು?', language: 'kn', category: 'forecast' },
  { id: 'kn-3', text: 'ಹತ್ತಿರದ ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರ (Cooling Centre) ಎಲ್ಲಿದೆ?', language: 'kn', category: 'cooling_centre' },
  { id: 'kn-4', text: 'ಹೀಟ್‌ಸ್ಟ್ರೋಕ್ (ಶಾಖಾಘಾತ) ಲಕ್ಷಣಗಳು ಮತ್ತು ತುರ್ತು ಚಿಕಿತ್ಸೆ ಏನು?', language: 'kn', category: 'safety' },
  { id: 'kn-5', text: 'ಇಂದು ಹಿರಿಯ ನಾಗರಿಕರನ್ನು ತೀವ್ರ ಬಿಸಿಲಿನಿಂದ ಹೇಗೆ ರಕ್ಷಿಸುವುದು?', language: 'kn', category: 'welfare' },
];

/**
 * Speech Recognition and Synthesis locale mapping
 */
export function getSpeechLocale(lang: SupportedLanguage): string {
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'kn':
      return 'kn-IN';
    case 'en':
    default:
      return typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')
        ? navigator.language
        : 'en-US';
  }
}

/**
 * Intelligent intent matcher and response generator with strict medical emergency guardrails.
 */
export function generateAssistantReply(
  userText: string,
  lang: SupportedLanguage,
  ctx: AssistantContext
): { text: string; intent: string; audioRecommended?: boolean } {
  const query = userText.toLowerCase().trim();

  // 1. EMERGENCY MEDICAL GUARDRAIL: Heat stroke / unconsciousness / severe symptoms
  const isEmergency = 
    query.includes('stroke') || 
    query.includes('unconscious') || 
    query.includes('faint') || 
    query.includes('vomit') || 
    query.includes('dizzy') || 
    query.includes('seizure') ||
    query.includes('hospital') ||
    query.includes('emergency') ||
    query.includes('चक्कर') ||
    query.includes('बेहोश') ||
    query.includes('उल्टी') ||
    query.includes('आपातकालीन') ||
    query.includes('ತಲೆಸುತ್ತು') ||
    query.includes('ಪ್ರಜ್ಞಾಹೀನ') ||
    query.includes('ವಾಂತಿ') ||
    query.includes('ತುರ್ತು');

  if (isEmergency) {
    if (lang === 'hi') {
      return {
        intent: 'medical_emergency',
        text: `⚠️ **आपातकालीन चिकित्सा सूचना:**\nहीटस्ट्रोक (लू लगना) एक जानलेवा स्थिति है। तुरंत आपातकालीन सहायता लें:\n\n📞 **आपातकालीन हेल्पलाइन:**\n• राष्ट्रीय आपातकालीन नंबर: **112**\n• एम्बुलेंस: **108**\n• राष्ट्रीय आपदा प्रबंधन हेल्पलाइन: **1070** / **1077**\n\n🚑 **तत्काल प्राथमिक उपचार (डॉक्टर आने तक):**\n1. व्यक्ति को तुरंत ठंडे, छायादार या वातानुकूलित कमरे में ले जाएं।\n2. तंग कपड़े ढीले करें या उतारें।\n3. गर्दन, बगल और कमर पर गीला ठंडा कपड़ा रखें या ठंडे पानी के छींटे मारें।\n4. यदि व्यक्ति बेहोश है, तो मुंह में कोई भी तरल पदार्थ बिल्कुल न डालें।`,
        audioRecommended: true
      };
    } else if (lang === 'kn') {
      return {
        intent: 'medical_emergency',
        text: `⚠️ **ತುರ್ತು ವೈದ್ಯಕೀಯ ಮುನ್ಸೂಚನೆ:**\nಶಾಖಾಘಾತ (Heat Stroke) ಜೀವಕ್ಕೆ ಅಪಾಯಕಾರಿ ವೈದ್ಯಕೀಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿದೆ. ತಕ್ಷಣ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ:\n\n📞 **ತುರ್ತು ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆಗಳು:**\n• ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಂಖ್ಯೆ: **112**\n• ಆಂಬ್ಯುಲೆನ್ಸ್: **108**\n• ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಸಹಾಯವಾಣಿ: **1070** / **1077**\n\n🚑 **ತಕ್ಷಣದ ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ಕ್ರಮಗಳು:**\n1. ವ್ಯಕ್ತಿಯನ್ನು ತಕ್ಷಣ ತಂಪಾದ ನೆರಳಿನ ಕೋಣೆಗೆ ಸ್ಥಳಾಂತರಿಸಿ.\n2. ಬಿಗಿಯಾದ ಬಟ್ಟೆಗಳನ್ನು ಸಡಿಲಗೊಳಿಸಿ.\n3. ಕುತ್ತಿಗೆ, ಕಂಕುಳು ಮತ್ತು ತೊಡೆಯ ಭಾಗಕ್ಕೆ ತಣ್ಣೀರಿನ ಬಟ್ಟೆ ಇರಿಸಿ.\n4. ವ್ಯಕ್ತಿ ಪ್ರಜ್ಞಾಹೀನನಾಗಿದ್ದರೆ, ಯಾವುದೇ ನೀರು ಅಥವಾ ದ್ರವವನ್ನು ಬಾಯಿಗೆ ಹಾಕಬೇಡಿ.`,
        audioRecommended: true
      };
    } else {
      return {
        intent: 'medical_emergency',
        text: `⚠️ **CRITICAL MEDICAL EMERGENCY NOTICE:**\nHeat stroke is a life-threatening medical emergency. Immediate medical intervention is required. Please call emergency dispatch immediately:\n\n📞 **Emergency Helplines:**\n• All-India Emergency Services: **112**\n• Ambulance Service: **108**\n• State Disaster Management Helpline: **1070** / **1077**\n\n🚑 **Immediate First-Aid Protocol (while waiting for medical crew):**\n1. Move the individual immediately to a cool, shaded, air-conditioned room.\n2. Loosen tight clothing.\n3. Apply cold wet towels or ice packs to the neck, armpits, and groin.\n4. Fan vigorously to promote evaporative cooling.\n5. *Do NOT give fluids if the person is confused or unconscious.*`,
        audioRecommended: true
      };
    }
  }

  // 2. COOLING CENTRES & WATER POINTS
  const isCoolingCentre = 
    query.includes('cooling') || 
    query.includes('shelter') || 
    query.includes('water') || 
    query.includes('kiosk') || 
    query.includes('केंद्र') || 
    query.includes('पानी') || 
    query.includes('ಆಶ್ರಯ') || 
    query.includes('ಕುಡಿಯುವ ನೀರು');

  if (isCoolingCentre) {
    const centre = ctx.nearestCoolingCentre || mockDb.getCoolingCentres()[0];
    const waterPoints = mockDb.getWaterPoints().slice(0, 2);
    const centreAmenities = centre
      ? [
          centre.air_conditioned ? 'Air Conditioning' : null,
          centre.drinking_water_available ? 'Chilled Water' : null,
          centre.medical_kit_available ? 'Medical Kit' : null,
          centre.wheelchair_accessible ? 'Wheelchair Accessible' : null
        ].filter(Boolean).join(', ')
      : 'AC, Potable Water, Medical First-Aid';

    if (lang === 'hi') {
      return {
        intent: 'cooling_centre',
        text: `❄️ **नजदीकी शीतल आश्रय (Cooling Centre):**\n**${centre?.name || 'सामुदायिक स्वास्थ्य केंद्र'}**\n📍 पता: ${centre?.address || 'समीपवर्ती नगर निगम केंद्र'}\n⏰ समय: ${centre?.operating_hours || 'सुबह 9:00 बजे से शाम 6:00 बजे तक'}\n सुविधाएँ: ${centreAmenities}\n\n💧 **पेयजल बूथ:**\n${waterPoints.map(w => `• ${w.name} (${w.locality_name}) - स्थिति: ${w.is_operational ? 'चालू' : 'मरम्मतधीन'}`).join('\n')}\n\nआप ऐप के **Cooling Centres** पेज पर जाकर सीधे गूगल मैप्स दिशा-निर्देश प्राप्त कर सकते हैं।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'cooling_centre',
        text: `❄️ **ಹತ್ತಿರದ ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರ (Cooling Centre):**\n**${centre?.name || 'ಸಮುದಾಯ ಆರೋಗ್ಯ ಕೇಂದ್ರ'}**\n📍 ವಿಳಾಸ: ${centre?.address || 'ಹತ್ತಿರದ ನಗರ ಪಾಲಿಕೆ ಕೇಂದ್ರ'}\n⏰ ಕಾರ್ಯಾವಧಿ: ${centre?.operating_hours || 'ಬೆಳಿಗ್ಗೆ 9:00 ರಿಂದ ಸಂಜೆ 6:00 ರವರೆಗೆ'}\n ಸೌಲಭ್ಯಗಳು: ${centreAmenities}\n\n💧 **ಸಾರ್ವಜನಿಕ ಕುಡಿಯುವ ನೀರಿನ ಪಾಯಿಂಟ್‌ಗಳು:**\n${waterPoints.map(w => `• ${w.name} (${w.locality_name}) - ಸ್ಥಿತಿ: ${w.is_operational ? 'ಲಭ್ಯವಿದೆ' : 'ದುರಸ್ತಿಯಲ್ಲಿದೆ'}`).join('\n')}\n\nಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ **Cooling Centres** ಪುಟವನ್ನು ವೀಕ್ಷಿಸಿ.`,
        audioRecommended: false
      };
    } else {
      return {
        intent: 'cooling_centre',
        text: `❄️ **Nearest Verified Cooling Shelter:**\n**${centre?.name || 'Community Health & Cooling Centre'}**\n📍 Address: ${centre?.address || 'Ward Municipality Centre'}\n⏰ Hours: ${centre?.operating_hours || '09:00 AM – 06:00 PM'}\n✅ Amenities: ${centreAmenities}\n\n💧 **Public Drinking Water Points:**\n${waterPoints.map(w => `• ${w.name} (${w.locality_name}) — Status: ${w.is_operational ? 'Active & Potable' : 'Under Service'}`).join('\n')}\n\nYou can view real-time distance and open turn-by-turn navigation in the **Cooling Centres** directory.`,
        audioRecommended: false
      };
    }
  }

  // 3. FORECAST & OUTLOOK (24h, 48h, 72h)
  const isForecast = 
    query.includes('forecast') || 
    query.includes('tomorrow') || 
    query.includes('next') || 
    query.includes('48') || 
    query.includes('72') || 
    query.includes('पूर्वानुमान') || 
    query.includes('कल') || 
    query.includes('ಮುನ್ಸೂಚನೆ') || 
    query.includes('ನಾಳೆ');

  if (isForecast) {
    const f24 = ctx.forecast24h;
    const peakTemp = f24?.predicted_temperature_c ? f24.predicted_temperature_c.toFixed(1) : (ctx.currentTemp + 1.2).toFixed(1);
    const riskTrend = f24?.risk_trend || 'increasing';

    if (lang === 'hi') {
      return {
        intent: 'forecast',
        text: `📈 **24 से 72 घंटे का हीटवेव पूर्वानुमान (${ctx.localityName}):**\n• आगामी 24 घंटे में अधिकतम तापमान: **${peakTemp}°C** रहने का अनुमान है।\n• जोखिम का रुझान: **${riskTrend === 'increasing' ? 'बढ़ रहा है ⚠️' : 'स्थिर है'}**\n• दोपहर **11:30 बजे से शाम 3:30 बजे** के बीच सीधी धूप में निकलने से बचें।\n• श्रमिकों और बुजुर्गों के लिए उच्च निर्जलीकरण जोखिम। पर्याप्त ओआरएस और पानी का सेवन करें।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'forecast',
        text: `📈 **ಮುಂದಿನ 24-72 ಗಂಟೆಗಳ ಶಾಖದ ಮುನ್ಸೂಚನೆ (${ctx.localityName}):**\n• ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಗರಿಷ್ಠ ತಾಪಮಾನ: **${peakTemp}°C** ತಲುಪುವ ನಿರೀಕ್ಷೆಯಿದೆ.\n• ಅಪಾಯದ ಪ್ರವೃತ್ತಿ: **${riskTrend === 'increasing' ? 'ಹೆಚ್ಚುತ್ತಿದೆ ⚠️' : 'ಸ್ಥಿರವಾಗಿದೆ'}**\n• ಮಧ್ಯಾಹ್ನ **11:30 ರಿಂದ ಸಂಜೆ 3:30** ರವರೆಗೆ ನೇರ ಸೂರ್ಯನ ಬಿಸಿಲಿಗೆ ಒಡ್ಡಿಕೊಳ್ಳಬೇಡಿ.\n• ನಿಯಮಿತವಾಗಿ ನೀರು ಮತ್ತು ಎಳನೀರು ಅಥವಾ ಒಆರ್‌ಎಸ್ ದ್ರವಗಳನ್ನು ಸೇವಿಸಿ.`,
        audioRecommended: false
      };
    } else {
      return {
        intent: 'forecast',
        text: `📈 **24–72 Hour Hyperlocal Heatwave Outlook (${ctx.localityName}):**\n• Projected 24h Peak Temperature: **${peakTemp}°C**\n• Risk Trend: **${riskTrend.toUpperCase()}** (${f24?.risk_category || ctx.riskCategory})\n• Critical Window: Direct exposure should strictly be avoided between **11:30 AM and 03:30 PM**.\n• Ground vegetation index remains low, driving heightened radiant surface temperatures. Review detailed curves on the **Predictions** page.`,
        audioRecommended: false
      };
    }
  }

  // 4. ELDERLY & VULNERABLE POPULATION PROTECTION
  const isVulnerable = 
    query.includes('elderly') || 
    query.includes('senior') || 
    query.includes('baby') || 
    query.includes('child') || 
    query.includes('parent') || 
    query.includes('protect') || 
    query.includes('बुजुर्ग') || 
    query.includes('बच्चे') || 
    query.includes('ರಕ್ಷಣೆ') || 
    query.includes('ಹಿರಿಯ');

  if (isVulnerable) {
    if (lang === 'hi') {
      return {
        intent: 'vulnerable_care',
        text: `🛡️ **बुजुर्गों और बच्चों की सुरक्षा के महत्वपूर्ण नियम:**\n1. **कमरे का तापमान:** दोपहर में खिड़कियों पर पर्दे डालें और पंखा/कूलर चालू रखें।\n2. **हाइड्रेशन:** प्यास न लगने पर भी हर 1 घंटे में पानी या नींबू पानी/ओआरएस दें।\n3. **दवाइयां:** उच्च रक्तचाप या हृदय रोग की दवाएं समय पर दें।\n4. **हल्के कपड़े:** ढीले और हल्के सूती वस्त्र पहनाएं।\n5. **दिन में दो बार जांच:** हीटशील्ड वालंटियर चेक-इन सुविधा से अपने क्षेत्र के स्वयंसेवकों से संपर्क में रहें।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'vulnerable_care',
        text: `🛡️ **ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಮಕ್ಕಳ ರಕ್ಷಣಾ ಮಾರ್ಗಸೂಚಿಗಳು:**\n1. **ಕೋಣೆಯ ವಾತಾವರಣ:** ಮಧ್ಯಾಹ್ನದ ಸಮಯದಲ್ಲಿ ಕಿಟಕಿಗಳಿಗೆ ಪರದೆ ಹಾಕಿ ತಂಪಾಗಿರಿಸಿ.\n2. **ದ್ರವಾಹಾರ ಸೇವನೆ:** ಬಾಯಾರಿಕೆಯಾಗದಿದ್ದರೂ ಗಂಟೆಗೊಮ್ಮೆ ನೀರು, ಮಜ್ಜಿಗೆ ಅಥವಾ ಒಆರ್‌ಎಸ್ ಕುಡಿಸಿ.\n3. **ಹಗುರ ಹತ್ತಿ ಬಟ್ಟೆ:** ಬಿಳಿ ಅಥವಾ ತಿಳಿ ಬಣ್ಣದ ಸಡಿಲ ಹತ್ತಿ ಉಡುಪುಗಳನ್ನು ಧರಿಸಿ.\n4. **ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಕ್ಷೇಮ ವಿಚಾರಣೆ:** ಹೀಟ್‌ಶೀಲ್ಡ್ ಸ್ವಯಂಸೇವಕರ ನೆರವು ಪಡೆಯಿರಿ.`,
        audioRecommended: false
      };
    } else {
      return {
        intent: 'vulnerable_care',
        text: `🛡️ **Safeguarding Senior Citizens & Vulnerable Residents:**\n1. **Indoor Thermal Management:** Draw curtains/blinds during peak daylight (11 AM – 4 PM) and maintain cross-ventilation or fans.\n2. **Hydration Schedule:** Offer sips of water, buttermilk, or oral rehydration salts every 45–60 minutes—do not wait for thirst sensation.\n3. **Medication Sensitivity:** Seniors on antihypertensives or diuretics are at elevated thermal risk. Store medications in cool places.\n4. **Active Welfare Tracking:** Volunteers can conduct scheduled home welfare checks via the **Smart Welfare Check-in** dashboard.`,
        audioRecommended: false
      };
    }
  }

  // 5. CURRENT HEAT RISK & AMBIENT CONDITIONS (Default/General)
  if (lang === 'hi') {
    return {
      intent: 'current_risk',
      text: `🌡️ **वर्तमान हीटवेव स्थिति (${ctx.localityName}):**\n• तापमान: **${ctx.currentTemp.toFixed(1)}°C** (अनुभूत तापमान: ${ctx.apparentTemp ? ctx.apparentTemp.toFixed(1) : (ctx.currentTemp + 2).toFixed(1)}°C)\n• हीट रिस्क स्कोर: **${ctx.riskScore.toFixed(0)}/100** (${ctx.riskCategory.toUpperCase()})\n• आर्द्रता: **${ctx.humidity || 48}%**\n\n💡 **परामर्श:** ${ctx.riskScore >= 75 ? 'गंभीर चेतावनी: बाहरी शारीरिक गतिविधियां तुरंत रोकें और छायादार/शीतल स्थान में रहें।' : ctx.riskScore >= 50 ? 'उच्च सतर्कता: पर्याप्त पानी पिएं और दोपहर की धूप से बचें।' : 'सामान्य सावधानी बरतें और दिनभर हाइड्रेटेड रहें।'}`,
      audioRecommended: false
    };
  } else if (lang === 'kn') {
    return {
      intent: 'current_risk',
      text: `🌡️ **ಪ್ರಸ್ತುತ ಶಾಖದ ವಿವರ (${ctx.localityName}):**\n• ತಾಪಮಾನ: **${ctx.currentTemp.toFixed(1)}°C** (ಅನುಭವಿಸುವ ತಾಪಮಾನ: ${ctx.apparentTemp ? ctx.apparentTemp.toFixed(1) : (ctx.currentTemp + 2).toFixed(1)}°C)\n• ಹೀಟ್ ರಿಸ್ಕ್ ಸ್ಕೋರ್: **${ctx.riskScore.toFixed(0)}/100** (${ctx.riskCategory})\n• ತೇವಾಂಶ: **${ctx.humidity || 48}%**\n\n💡 **ಸಲಹೆ:** ${ctx.riskScore >= 75 ? 'ತೀವ್ರ ಎಚ್ಚರಿಕೆ: ಬಿಸಿಲಿನಲ್ಲಿ ಕೆಲಸ ಮಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ ಮತ್ತು ತಂಪಾದ ಸ್ಥಳಗಳಲ್ಲಿ ಆಶ್ರಯ ಪಡೆಯಿರಿ.' : ctx.riskScore >= 50 ? 'ಹೆಚ್ಚಿನ ಜಾಗರೂಕತೆ: ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ಮಧ್ಯಾಹ್ನ ಹೊರಹೋಗುವುದನ್ನು ತಪ್ಪಿಸಿ.' : 'ಸಾಮಾನ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆ ವಹಿಸಿ ಮತ್ತು ಚೆನ್ನಾಗಿ ನೀರು ಕುಡಿಯಿರಿ.'}`,
      audioRecommended: false
    };
  } else {
    return {
      intent: 'current_risk',
      text: `🌡️ **Hyperlocal Heat Risk Telemetry (${ctx.localityName}):**\n• Ambient Temperature: **${ctx.currentTemp.toFixed(1)}°C** (Feels like: ${ctx.apparentTemp ? ctx.apparentTemp.toFixed(1) : (ctx.currentTemp + 2.1).toFixed(1)}°C)\n• Heat Risk Index: **${ctx.riskScore.toFixed(0)} / 100** (${ctx.riskCategory.toUpperCase()})\n• Relative Humidity: **${ctx.humidity || 48}%**\n\n💡 **Operational Guidance:** ${
        ctx.riskScore >= 75 
          ? 'CRITICAL ALERT: Suspend outdoor physical labor. Seek verified cooling centres immediately.' 
          : ctx.riskScore >= 50 
          ? 'HIGH HEAT ADVISORY: Maintain active fluid hydration, schedule tasks in early morning or evening.' 
          : 'MODERATE HEAT CONDITIONS: Keep personal water bottles handy and check in on elderly neighbors.'
      }`,
      audioRecommended: false
    };
  }
}
