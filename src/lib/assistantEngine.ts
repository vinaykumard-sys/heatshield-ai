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

/**
 * The 4 core resident prompts prominently featured in HeatShield 2.0 empty states and quick chips
 */
export const SUGGESTED_PROMPTS: AssistantSuggestedPrompt[] = [
  // English
  {
    id: 'en-peak-heat',
    text: 'What should I do during peak heat today?',
    language: 'en',
    category: 'safety'
  },
  {
    id: 'en-exhaustion-vs-stroke',
    text: 'Recognize signs of heat exhaustion vs heatstroke',
    language: 'en',
    category: 'safety'
  },
  {
    id: 'en-seniors-pets',
    text: 'Safe walking hours for seniors & pets',
    language: 'en',
    category: 'welfare'
  },
  {
    id: 'en-cooling-shelters',
    text: 'Nearby cooling shelters and hydration points',
    language: 'en',
    category: 'cooling_centre'
  },

  // Hindi
  {
    id: 'hi-peak-heat',
    text: 'आज दोपहर की चरम गर्मी में मुझे क्या करना चाहिए?',
    language: 'hi',
    category: 'safety'
  },
  {
    id: 'hi-exhaustion-vs-stroke',
    text: 'हीट एग्जॉशन और हीटस्ट्रोक के लक्षणों में अंतर कैसे पहचानें?',
    language: 'hi',
    category: 'safety'
  },
  {
    id: 'hi-seniors-pets',
    text: 'बुजुर्गों और पालतू जानवरों के लिए टहलने का सुरक्षित समय',
    language: 'hi',
    category: 'welfare'
  },
  {
    id: 'hi-cooling-shelters',
    text: 'नजदीकी शीतल आश्रय (Cooling Centres) और पेयजल केंद्र',
    language: 'hi',
    category: 'cooling_centre'
  },

  // Kannada
  {
    id: 'kn-peak-heat',
    text: 'ಇಂದು ಮಧ್ಯಾಹ್ನದ ತೀವ್ರ ಬಿಸಿಲಿನಲ್ಲಿ ನಾನು ಏನು ಮಾಡಬೇಕು?',
    language: 'kn',
    category: 'safety'
  },
  {
    id: 'kn-exhaustion-vs-stroke',
    text: 'ಶಾಖದ ಬಳಲಿಕೆ ಮತ್ತು ಹೀಟ್‌ಸ್ಟ್ರೋಕ್ ಲಕ್ಷಣಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸ',
    language: 'kn',
    category: 'safety'
  },
  {
    id: 'kn-seniors-pets',
    text: 'ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಸಾಕುಪ್ರಾಣಿಗಳಿಗೆ ಸುರಕ್ಷಿತ ನಡಿಗೆ ಸಮಯ',
    language: 'kn',
    category: 'welfare'
  },
  {
    id: 'kn-cooling-shelters',
    text: 'ಹತ್ತಿರದ ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರಗಳು ಮತ್ತು ಕುಡಿಯುವ ನೀರಿನ ಕೇಂದ್ರಗಳು',
    language: 'kn',
    category: 'cooling_centre'
  }
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

  // 1. DEDICATED PROMPT 2: RECOGNIZE SIGNS OF HEAT EXHAUSTION VS HEATSTROKE
  const isExhaustionVsStroke =
    (query.includes('exhaustion') && query.includes('stroke')) ||
    query.includes('vs') ||
    query.includes('recognize signs') ||
    query.includes('लक्षणों में अंतर') ||
    query.includes('ವ್ಯತ್ಯಾಸ') ||
    (query.includes('difference') && (query.includes('heat') || query.includes('stroke')));

  if (isExhaustionVsStroke) {
    if (lang === 'hi') {
      return {
        intent: 'medical_guidance',
        text: `🩺 **हीट एग्जॉशन (गर्मी की थकावट) बनाम हीटस्ट्रोक (लू लगना):**\n\n🟡 **1. हीट एग्जॉशन (सावधानी आवश्यक):**\n• लक्षण: अत्यधिक पसीना आना, त्वचा चिपचिपी/पीली होना, चक्कर आना, जी मिचलाना, मांसपेशियों में ऐंठन।\n• क्या करें: तुरंत छाया या वातानुकूलित कमरे में जाएं, ठंडे पानी या ओआरएस (ORS) के छोटे घूंट पिएं, कपड़े ढीले करें।\n\n🔴 **2. हीटस्ट्रोक (जानलेवा आपातकाल - तुरंत 112/108 डायल करें):**\n• लक्षण: शरीर का तापमान 40°C (104°F) से ऊपर, पसीना बंद होना (त्वचा गर्म व सूखी/लाल), भ्रम, लड़खड़ाती आवाज, बेहोशी या दौरे।\n• क्या करें: डॉक्टर के आने तक मरीज की गर्दन, कांख और कमर पर बर्फ या गीली ठंडी पट्टियां रखें। *बेहोश व्यक्ति को पानी न पिलाएं।*`,
        audioRecommended: true
      };
    } else if (lang === 'kn') {
      return {
        intent: 'medical_guidance',
        text: `🩺 **ಶಾಖದ ಬಳಲಿಕೆ (Heat Exhaustion) ಮತ್ತು ಹೀಟ್‌ಸ್ಟ್ರೋಕ್ ನಡುವಿನ ವ್ಯತ್ಯಾಸ:**\n\n🟡 **1. ಶಾಖದ ಬಳಲಿಕೆ (Heat Exhaustion):**\n• ಲಕ್ಷಣಗಳು: ಅತಿಯಾದ ಬೆವರು, ತೆಳು/ಜಿಡ್ಡಿನ ಚರ್ಮ, ತಲೆತಿರುಗುವಿಕೆ, ವಾಕರಿಕೆ, ಮಾಂಸಖಂಡ ಸೆಳೆತ.\n• ತುರ್ತು ಕ್ರಮ: ತಕ್ಷಣ ತಂಪಾದ ನೆರಳಿಗೆ ಹೋಗಿ, ನಿಧಾನವಾಗಿ ನೀರು ಅಥವಾ ಒಆರ್‌ಎಸ್ ಕುಡಿಯಿರಿ, ಸಡಿಲ ಬಟ್ಟೆ ಧರಿಸಿ.\n\n🔴 **2. ಹೀಟ್‌ಸ್ಟ್ರೋಕ್ (ಜೀವಕ್ಕೆ ಅಪಾಯಕಾರಿ ತುರ್ತು ಪರಿಸ್ಥಿತಿ - 112/108 ಕರೆ ಮಾಡಿ):**\n• ಲಕ್ಷಣಗಳು: 40°C ಗಿಂತ ಹೆಚ್ಚಿನ ಶರೀರದ ತಾಪಮಾನ, ಬೆವರು ನಿಲ್ಲುವುದು, ಕೆಂಪಾದ ಒಣ ಚರ್ಮ, ಗೊಂದಲ ಅಥವಾ ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು.\n• ತುರ್ತು ಕ್ರಮ: ರೋಗಿಯ ಕುತ್ತಿಗೆ, ಕಂಕುಳಿಗೆ ತಣ್ಣೀರಿನ ಬಟ್ಟೆ ಇರಿಸಿ. ಪ್ರಜ್ಞಾಹೀನರಿಗೆ ನೀರು ಕುಡಿಸಬೇಡಿ.`,
        audioRecommended: true
      };
    } else {
      return {
        intent: 'medical_guidance',
        text: `🩺 **Recognizing Heat Exhaustion vs. Heatstroke:**\n\n🟡 **1. Heat Exhaustion (Thermal Overload — Act Quickly):**\n• **Key Symptoms:** Profuse sweating, pale/clammy skin, dizziness, persistent nausea, weakness, muscle cramps, and normal mental alertness.\n• **Immediate Action:** Move to an air-conditioned room or deep shade. Sip cool water with oral electrolytes (ORS). Loosen restrictive clothing and rest flat with legs slightly elevated.\n\n🔴 **2. Heatstroke (CRITICAL MEDICAL EMERGENCY — Call 112 / 108):**\n• **Key Symptoms:** Core temperature exceeding 40°C (104°F), hot red dry skin (sweating mechanism fails), disorientation, slurred speech, hallucinations, seizures, or loss of consciousness.\n• **Immediate Action:** Call **112 / 108 immediately**. While dispatch is en route, aggressively cool the patient: apply ice or cold soaked towels to the neck, armpits, and groin. *Never administer oral fluids to an incoherent or unconscious person.*`,
        audioRecommended: true
      };
    }
  }

  // 2. CRITICAL EMERGENCY MEDICAL GUARDRAIL: Heat stroke / unconsciousness / severe symptoms
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

  // 3. DEDICATED PROMPT 1: WHAT SHOULD I DO DURING PEAK HEAT TODAY?
  const isPeakHeat =
    query.includes('peak') ||
    query.includes('what should i do') ||
    query.includes('today') ||
    query.includes('चरम गर्मी') ||
    query.includes('ಮಧ್ಯಾಹ್ನದ');

  if (isPeakHeat) {
    if (lang === 'hi') {
      return {
        intent: 'peak_heat_plan',
        text: `☀️ **आज दोपहर की चरम गर्मी में सुरक्षा नियम (${ctx.localityName}):**\n\n1. **चरम धूप का समय (11:30 AM - 3:30 PM):** अनावश्यक रूप से बाहर निकलने से पूरी तरह बचें। सूरज की किरणें और पराबैंगनी (UV) विकिरण इस समय उच्चतम स्तर पर होते हैं।\n2. **सक्रिय हाइड्रेशन नियम:** प्यास का इंतजार न करें। हर 30 मिनट में कम से कम 250 मिलीलीटर पानी, छाछ, नारियल पानी या ओआरएस पिएं।\n3. **कमरे को ठंडा रखें:** सूरज की ओर वाली खिड़कियों के पर्दे बंद रखें। क्रॉस-वेंटिलेशन के लिए शाम को खिड़कियां खोलें।\n4. **हल्के सूती कपड़े:** हल्के रंग के ढीले सूती कपड़े पहनें। बाहर जाते समय धूप का चश्मा और टोपी या छाता अवश्य लें।\n5. **शारीरिक कार्य का समय:** भारी काम और व्यायाम केवल सुबह 8:30 बजे से पहले या शाम 5:30 बजे के बाद ही करें।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'peak_heat_plan',
        text: `☀️ **ಇಂದು ತೀವ್ರ ಬಿಸಿಲಿನ ಸಮಯದಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಬೇಕಾದ ಕ್ರಮಗಳು (${ctx.localityName}):**\n\n1. **ತೀವ್ರ ಬಿಸಿಲಿನ ಸಮಯ (11:30 AM - 3:30 PM):** ಅನಿವಾರ್ಯವಲ್ಲದ ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತಪ್ಪಿಸಿ.\n2. **ಹೈಡ್ರೇಶನ್ ನಿಯಮ:** ಪ್ರತಿ 30 ನಿಮಿಷಕ್ಕೊಮ್ಮೆ 250 ಮಿಲಿ ನೀರು, ಮಜ್ಜಿಗೆ, ಎಳನೀರು ಅಥವಾ ಒಆರ್‌ಎಸ್ ಕುಡಿಯಿರಿ.\n3. **ಮನೆಯನ್ನು ತಂಪಾಗಿರಿಸಿ:** ಕಿಟಕಿಗಳಿಗೆ ಪರದೆಗಳನ್ನು ಎಳೆಯಿರಿ ಮತ್ತು ಮನೆಯೊಳಗೆ ಗಾಳಿ ಬೆಳಕು ಇರುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ.\n4. **ಹಗುರವಾದ ಹತ್ತಿ ಉಡುಪು:** ಬಿಳಿ ಅಥವಾ ತಿಳಿ ಬಣ್ಣದ ಸಡಿಲ ಹತ್ತಿ ಉಡುಪುಗಳನ್ನು ಧರಿಸಿ.\n5. **ವ್ಯಾಯಾಮ ಹಾಗೂ ನಡಿಗೆ:** ಬೆಳಿಗ್ಗೆ 8:30 ರ ಮೊದಲು ಅಥವಾ ಸಂಜೆ 5:30 ರ ನಂತರ ಮಾತ್ರ ಯೋಜಿಸಿ.`,
        audioRecommended: false
      };
    } else {
      return {
        intent: 'peak_heat_plan',
        text: `☀️ **Action Plan for Peak Heat Hours Today in ${ctx.localityName}:**\n\n1. **Danger Window (11:30 AM – 03:30 PM):** Suspend all non-essential outdoor travel and strenuous labor during this peak solar radiant window.\n2. **Scheduled Micro-Hydration:** Drink 250–300 ml of water or electrolyte solution every 30 minutes, even if you do not feel actively thirsty.\n3. **Indoor Thermal Shielding:** Keep west- and south-facing curtains closed to block infrared heat radiation. Run ceiling fans or coolers in shaded rooms.\n4. **Protective Attire:** Wear loose, light-colored, breathable cotton or linen clothing, a wide-brim hat, and UV400 sunglasses if stepping outside.\n5. **Vulnerable Check-ins:** Ring up senior relatives and outdoor workers at 1:00 PM to verify hydration and comfort.`,
        audioRecommended: false
      };
    }
  }

  // 4. DEDICATED PROMPT 3: SAFE WALKING HOURS FOR SENIORS & PETS
  const isSeniorsPets =
    query.includes('pet') ||
    query.includes('dog') ||
    query.includes('senior') ||
    query.includes('walk') ||
    query.includes('walking') ||
    query.includes('animal') ||
    query.includes('टहलने') ||
    query.includes('पालतू') ||
    query.includes('ಹಿರಿಯ') ||
    query.includes('ಸಾಕುಪ್ರಾಣಿ') ||
    query.includes('ನಡಿಗೆ');

  if (isSeniorsPets) {
    if (lang === 'hi') {
      return {
        intent: 'seniors_pets_safety',
        text: `🐾 **बुजुर्गों और पालतू जानवरों के लिए टहलने का सुरक्षित समय:**\n\n⏰ **सुरक्षित समय सारिणी:**\n• प्रातः काल: **सुबह 05:30 से 08:30 बजे तक** (सबसे सुरक्षित)\n• सायंकाल: **शाम 05:45 बजे के बाद**\n• दोपहर 10:00 AM से शाम 05:00 PM के बीच टहलना पूर्णतः वर्जित है।\n\n🐕 **पालतू कुत्तों के लिए 7-सेकंड डामर परीक्षण (Asphalt Test):**\nसड़क पर अपनी हथेली का पिछला हिस्सा 7 सेकंड तक रखें। यदि यह आपके लिए बहुत गर्म है, तो यह आपके पालतू जानवर के पंजों (Paws) को जला देगा! गर्म सड़क पर तापमान 55°C से अधिक हो सकता है।\n\n👴 **बुजुर्गों के लिए विशेष देखभाल:**\n• केवल छायादार पार्कों में टहलें।\n• साथ में पानी की बोतल रखें और चक्कर आने पर तुरंत बैठ जाएं।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'seniors_pets_safety',
        text: `🐾 **ಹಿರಿಯರು ಮತ್ತು ಸಾಕುಪ್ರಾಣಿಗಳಿಗೆ ನಡಿಗೆಯ ಸುರಕ್ಷಿತ ಮಾರ್ಗಸೂಚಿ:**\n\n⏰ **ಸುರಕ್ಷಿತ ಸಮಯಗಳು:**\n• ಬೆಳಿಗ್ಗೆ: **05:30 ರಿಂದ 08:30 ರವರೆಗೆ** (ಅತ್ಯಂತ ಸುರಕ್ಷಿತ)\n• ಸಂಜೆ: **05:45 ರ ನಂತರ**\n• ಮಧ್ಯಾಹ್ನ 10:00 ರಿಂದ ಸಂಜೆ 5:00 ರವರೆಗೆ ಹೊರಗೆ ಕರೆದೊಯ್ಯಬೇಡಿ.\n\n🐕 **ಸಾಕುಪ್ರಾಣಿಗಳ ಪಂಜಗಳ ರಕ್ಷಣೆ (7-ಸೆಕೆಂಡ್ ಪರೀಕ್ಷೆ):**\nನಿಮ್ಮ ಕೈಯನ್ನು ರಸ್ತೆಯ ಡಾಂಬರಿನ ಮೇಲೆ 7 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಇರಿಸಿ. ಅದು ಬಿಸಿಯಾಗಿದ್ದರೆ, ನಿಮ್ಮ ನಾಯಿಯ ಪಂಜಗಳು ಸುಟ್ಟುಹೋಗುತ್ತವೆ! ರಸ್ತೆಯ ಬಿಸಿಲು 55°C ತಲುಪಬಹುದು.\n\n👴 **ಹಿರಿಯ ನಾಗರಿಕರ ಮುನ್ನೆಚ್ಚರಿಕೆ:**\n• ನೆರಳಿನ ಮಾರ್ಗಗಳಲ್ಲಿ ಮಾತ್ರ ನಡೆಯಿರಿ ಮತ್ತು ಯಾವಾಗಲೂ ನೀರಿನ ಬಾಟಲಿಯನ್ನು ಜೊತೆಯಲ್ಲಿಡಿ.`,
        audioRecommended: false
      };
    } else {
      return {
        intent: 'seniors_pets_safety',
        text: `🐾 **Safe Walking Hours & Guidelines for Seniors & Pets:**\n\n⏰ **Recommended Walking Windows:**\n• **Morning Safe Slot:** 05:30 AM – 08:30 AM (Coolest ground temperature)\n• **Evening Safe Slot:** After 05:45 PM (Once radiant asphalt heat dissipates)\n• **STRICT NO-WALK ZONE:** 10:00 AM – 05:00 PM\n\n🐕 **The 7-Second Pavement Rule for Pets:**\nPlace the back of your bare hand flat on the sidewalk/asphalt for 7 continuous seconds. If it's too hot for you to comfortably hold, it will blister your dog's sensitive paw pads. Under 35°C ambient air, dark pavement can easily reach 55°C–62°C!\n\n👴 **Essential Safeguards for Seniors:**\n• Stick strictly to tree-shaded garden paths rather than concrete streets.\n• Hydrate before stepping out; seniors lose thirst sensitivity as temperatures rise.\n• Stop immediately if experiencing lightheadedness or calf fatigue.`,
        audioRecommended: false
      };
    }
  }

  // 5. DEDICATED PROMPT 4: NEARBY COOLING SHELTERS AND HYDRATION POINTS
  const isCoolingCentre = 
    query.includes('cooling') || 
    query.includes('shelter') || 
    query.includes('water') || 
    query.includes('kiosk') || 
    query.includes('hydration') ||
    query.includes('points') ||
    query.includes('केंद्र') || 
    query.includes('पानी') || 
    query.includes('आश्रय') || 
    query.includes('ಆಶ್ರಯ') || 
    query.includes('ಕುಡಿಯುವ ನೀರು');

  if (isCoolingCentre) {
    const centres = mockDb.getCoolingCentres();
    const centre = ctx.nearestCoolingCentre || centres[0];
    const waterPoints = mockDb.getWaterPoints().slice(0, 3);
    const centreAmenities = centre
      ? [
          centre.air_conditioned ? 'Air Conditioning' : null,
          centre.drinking_water_available ? 'Chilled Water & ORS' : null,
          centre.medical_kit_available ? 'First-Aid Kit' : null,
          centre.wheelchair_accessible ? 'Wheelchair Accessible' : null
        ].filter(Boolean).join(', ')
      : 'Air Conditioning, Free Potable Water, Medical First-Aid';

    if (lang === 'hi') {
      return {
        intent: 'cooling_centre',
        text: `❄️ **नजदीकी सत्यापित शीतल आश्रय (Cooling Shelter):**\n**${centre?.name || 'सामुदायिक स्वास्थ्य केंद्र'}**\n📍 पता: ${centre?.address || 'समीपवर्ती नगर निगम केंद्र'}\n⏰ कार्य समय: ${centre?.operating_hours || 'सुबह 9:00 बजे से शाम 6:00 बजे तक'}\n✅ सुविधाएं: ${centreAmenities}\n\n💧 **सत्यापित सार्वजनिक पेयजल और ओआरएस बूथ:**\n${waterPoints.map(w => `• **${w.name}** (${w.locality_name}) — स्थिति: ${w.is_operational ? 'सक्रिय एवं निःशुल्क' : 'मरम्मतधीन'}`).join('\n')}\n\nआप सीधे **Cooling Centres** पेज से वन-टैप गूगल मैप्स नेविगेशन शुरू कर सकते हैं।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'cooling_centre',
        text: `❄️ **ಹತ್ತಿರದ ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರ (Cooling Shelter):**\n**${centre?.name || 'ಸಮುದಾಯ ಆರೋಗ್ಯ ಕೇಂದ್ರ'}**\n📍 ವಿಳಾಸ: ${centre?.address || 'ಹತ್ತಿರದ ನಗರ ಪಾಲಿಕೆ ಕೇಂದ್ರ'}\n⏰ ಕಾರ್ಯಾವಧಿ: ${centre?.operating_hours || 'ಬೆಳಿಗ್ಗೆ 9:00 ರಿಂದ ಸಂಜೆ 6:00 ರವರೆಗೆ'}\n✅ ಸೌಲಭ್ಯಗಳು: ${centreAmenities}\n\n💧 **ಸಾರ್ವಜನಿಕ ಕುಡಿಯುವ ನೀರಿನ ಕೇಂದ್ರಗಳು:**\n${waterPoints.map(w => `• **${w.name}** (${w.locality_name}) — ಸ್ಥಿತಿ: ${w.is_operational ? 'ಲಭ್ಯವಿದೆ' : 'ದುರಸ್ತಿಯಲ್ಲಿದೆ'}`).join('\n')}\n\nಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಮತ್ತು ನಕ್ಷೆಯ ಮಾರ್ಗಕ್ಕಾಗಿ **Cooling Centres** ಪುಟವನ್ನು ನೋಡಿ.`,
        audioRecommended: false
      };
    } else {
      return {
        intent: 'cooling_centre',
        text: `❄️ **Nearest Verified Cooling Shelter & Refuges:**\n**${centre?.name || 'Community Health & Public Cooling Centre'}**\n📍 Address: ${centre?.address || 'Municipal Ward Community Hall'}\n⏰ Hours: ${centre?.operating_hours || '09:00 AM – 06:00 PM (Daily)'}\n✅ Amenities: ${centreAmenities}\n\n💧 **Public Drinking Water & ORS Kiosks:**\n${waterPoints.map(w => `• **${w.name}** (${w.locality_name}) — Status: ${w.is_operational ? 'Active & Free Potable Water' : 'Scheduled Maintenance'}`).join('\n')}\n\nYou can view real-time walking distances and launch turn-by-turn navigation in the **Cooling Centres** directory.`,
        audioRecommended: false
      };
    }
  }

  // 6. FORECAST & OUTLOOK (24h, 48h, 72h)
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
        text: `📈 **24 से 72 घंटे का हीटवेव पूर्वानुमान (${ctx.localityName}):**\n• आगामी 24 घंटे में अधिकतम तापमान: **${peakTemp}°C** रहने का अनुमान है।\n• जोखिम का रुझान: **${riskTrend === 'increasing' ? 'बढ़ रहा है ⚠️' : 'स्थिर है'}**\n• दोपहर **11:30 बजे से शाम 3:30 बजे** के बीच सीधी धूप में निकलने से बचें।\n• पर्याप्त ओआरएस और पानी का सेवन करें।`,
        audioRecommended: false
      };
    } else if (lang === 'kn') {
      return {
        intent: 'forecast',
        text: `📈 **ಮುಂದಿನ 24-72 ಗಂಟೆಗಳ ಶಾಖದ ಮುನ್ಸೂಚನೆ (${ctx.localityName}):**\n• ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಗರಿಷ್ಠ ತಾಪಮಾನ: **${peakTemp}°C** ತಲುಪುವ ನಿರೀಕ್ಷೆಯಿದೆ.\n• ಅಪಾಯದ ಪ್ರವೃತ್ತಿ: **${riskTrend === 'increasing' ? 'ಹೆಚ್ಚುತ್ತಿದೆ ⚠️' : 'ಸ್ಥಿರವಾಗಿದೆ'}**\n• ಮಧ್ಯಾಹ್ನ **11:30 ರಿಂದ ಸಂಜೆ 3:30** ರವರೆಗೆ ನೇರ ಸೂರ್ಯನ ಬಿಸಿಲಿಗೆ ಒಡ್ಡಿಕೊಳ್ಳಬೇಡಿ.`,
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

  // 7. CURRENT HEAT RISK & AMBIENT CONDITIONS (Default/General)
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
