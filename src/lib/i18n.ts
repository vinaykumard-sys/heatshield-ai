import { SupportedLanguage } from '../types';

export const translations = {
  en: {
    brand: 'HeatShield AI',
    tagline: 'Predict. Protect. Prevent.',
    subTagline: 'AI-Powered Hyperlocal Heat Risk Prediction & Community Protection Platform for India',
    
    // Nav & Common
    navHome: 'Overview',
    navDashboard: 'Dashboard',
    navMap: 'AI Heat Risk Map',
    navResidents: 'Vulnerable Residents',
    navCheckins: 'Welfare Check-ins',
    navRequests: 'Assistance Requests',
    navAdmin: 'Administration',
    navAnalytics: 'Analytics & Reports',
    navPortal: 'Resident Portal',
    navLogin: 'Sign In',
    navLogout: 'Sign Out',
    navSignUp: 'Register',
    
    // Disclaimer
    medicalDisclaimer: 'Notice: HeatShield AI calculates environmental heat risk indicators and community vulnerability factors. It does NOT provide medical diagnoses or individual clinical emergency assessments.',
    medicalDisclaimerShort: 'Environmental risk advisory. Not medical advice or emergency 108/112 dispatch.',
    
    // Roles
    roleAdmin: 'Administrator',
    roleVolunteer: 'Community Volunteer',
    roleResident: 'Resident / Community Member',
    
    // Risk Categories
    riskLow: 'Low Risk',
    riskModerate: 'Moderate Risk',
    riskHigh: 'High Risk',
    riskCritical: 'Critical Heat Risk',
    
    // Statuses
    statusPending: 'Pending Check-in',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusUnableToContact: 'Unable to Contact',
    statusEscalated: 'Escalated to Team Lead',
    
    // Request categories
    reqWater: 'Water Assistance (ORS / Hydration)',
    reqCooling: 'Cooling Assistance (Fan/Shade/ORU)',
    reqWelfare: 'General Welfare Check-in',
    reqCoolingCentre: 'Cooling Centre Transport',
    reqOther: 'Other Community Aid',

    // Action buttons
    btnGetStarted: 'Get Started',
    btnViewDashboard: 'View Risk Dashboard',
    btnSearchLocation: 'Search locality...',
    btnSubmitRequest: 'Submit Assistance Request',
    btnRecordCheckin: 'Log Check-in Status',
    btnConfirmSafe: 'Confirm I Am Safe',
    btnExportCsv: 'Export CSV Report',
    btnRefreshData: 'Fetch Live Weather',
    btnManageConsent: 'Manage Consent & Privacy',
    
    // AI Explanations
    aiAnalysisHeader: 'AI Heat Risk Factor Breakdown',
    aiModelConfidence: 'AI Model Confidence',
    aiCheckinPriority: 'Recommended Volunteer Action Priority',
    contributingFactors: 'Contributing Environmental & Exposure Factors',
    preventiveGuidance: 'Recommended Community Action Protocol',
    
    // Metrics
    metricTemp: 'Ambient Temperature',
    metricHumidity: 'Relative Humidity',
    metricFeelsLike: 'Heat Index (Feels Like)',
    metricWetBulb: 'Wet Bulb Temperature',
    metricUV: 'UV Exposure Index',
    metricWind: 'Wind Speed',
    
    // Prompts
    liveDataBadge: 'LIVE IMD / Open-Meteo',
    simulatedDataBadge: 'SIMULATED DATASET',
    coolingCentres: 'Cooling Shelters Nearby',
  },
  
  hi: {
    brand: 'हीटशील्ड एआई',
    tagline: 'पूर्वानुमान। सुरक्षा। रोकथाम।',
    subTagline: 'भारत के लिए एआई-संचालित स्थानीय अत्यधिक गर्मी जोखिम पूर्वानुमान और सामुदायिक सुरक्षा मंच',
    
    // Nav & Common
    navHome: 'होम',
    navDashboard: 'डैशबोर्ड',
    navMap: 'गर्मी जोखिम मानचित्र',
    navResidents: 'अतिसंवेदनशील निवासी',
    navCheckins: 'कल्याण जांच (चेक-इन)',
    navRequests: 'सहायता अनुरोध',
    navAdmin: 'प्रशासन',
    navAnalytics: 'विश्लेषण और रिपोर्ट',
    navPortal: 'नागरिक पोर्टल',
    navLogin: 'लॉग इन करें',
    navLogout: 'लॉग आउट',
    navSignUp: 'पंजीकरण करें',
    
    // Disclaimer
    medicalDisclaimer: 'सूचना: हीटशील्ड एआई पर्यावरणीय गर्मी जोखिम और सामुदायिक कारकों का विश्लेषण करता है। यह कोई चिकित्सीय निदान या व्यक्तिगत आपातकालीन चिकित्सा भविष्यवाणी नहीं है।',
    medicalDisclaimerShort: 'पर्यावरणीय जोखिम सलाह। यह चिकित्सीय सलाह या आपातकालीन 108/112 सेवा नहीं है।',
    
    // Roles
    roleAdmin: 'प्रशासक',
    roleVolunteer: 'सामुदायिक स्वयंसेवक',
    roleResident: 'निवासी / नागरिक',
    
    // Risk Categories
    riskLow: 'कम जोखिम',
    riskModerate: 'मध्यम जोखिम',
    riskHigh: 'उच्च जोखिम',
    riskCritical: 'गंभीर ताप जोखिम (खतरा)',
    
    // Statuses
    statusPending: 'लंबित चेक-इन',
    statusInProgress: 'प्रगति पर है',
    statusCompleted: 'पूर्ण हुआ',
    statusUnableToContact: 'संपर्क नहीं हो सका',
    statusEscalated: 'उच्च स्तर पर भेजा गया',
    
    // Request categories
    reqWater: 'पेयजल / ओआरएस सहायता',
    reqCooling: 'शीतलन सहायता (पंखा/छाया)',
    reqWelfare: 'सामान्य स्वास्थ्य एवं कल्याण जांच',
    reqCoolingCentre: 'कूलिंग सेंटर तक सहायता',
    reqOther: 'अन्य सामुदायिक सहायता',

    // Action buttons
    btnGetStarted: 'शुरू करें',
    btnViewDashboard: 'जोखिम डैशबोर्ड देखें',
    btnSearchLocation: 'इलाका खोजें...',
    btnSubmitRequest: 'सहायता अनुरोध दर्ज करें',
    btnRecordCheckin: 'चेक-इन स्थिति दर्ज करें',
    btnConfirmSafe: 'पुष्टि करें: मैं सुरक्षित हूँ',
    btnExportCsv: 'सीएसवी रिपोर्ट डाउनलोड करें',
    btnRefreshData: 'मौसम डेटा अपडेट करें',
    btnManageConsent: 'सहमति और गोपनीयता प्रबंधन',
    
    // AI Explanations
    aiAnalysisHeader: 'एआई ताप जोखिम कारक विश्लेषण',
    aiModelConfidence: 'एआई मॉडल विश्वसनीयता',
    aiCheckinPriority: 'अनुशंसित स्वयंसेवक प्राथमिकता',
    contributingFactors: 'जोखिम में योगदान देने वाले कारक',
    preventiveGuidance: 'अनुशंसित सामुदायिक सुरक्षा प्रोटोकॉल',
    
    // Metrics
    metricTemp: 'परिवेशी तापमान',
    metricHumidity: 'सापेक्ष आर्द्रता',
    metricFeelsLike: 'अनुभूत तापमान (हीट इंडेक्स)',
    metricWetBulb: 'वेट बल्ब तापमान',
    metricUV: 'पराबैंगनी (UV) सूचकांक',
    metricWind: 'हवा की गति',
    
    // Prompts
    liveDataBadge: 'लाइव मौसम डेटा',
    simulatedDataBadge: 'सिम्युलेटेड डेटा',
    coolingCentres: 'निकटतम शीतलन आश्रय',
  },
  
  kn: {
    brand: 'ಹೀಟ್‌ಶೀಲ್ಡ್ ಎಐ',
    tagline: 'ಮುನ್ಸೂಚನೆ. ರಕ್ಷಣೆ. ತಡೆಗಟ್ಟುವಿಕೆ.',
    subTagline: 'ಭಾರತಕ್ಕಾಗಿ ಎಐ-ಚಾಲಿತ ಅತಿ ಸ್ಥಳೀಯ ತಾಪಮಾನ ಅಪಾಯ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಸಮುದಾಯ ರಕ್ಷಣೆ ವೇದಿಕೆ',
    
    // Nav & Common
    navHome: 'ಮುಖಪುಟ',
    navDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navMap: 'ಶಾಖದ ಅಪಾಯ ನಕ್ಷೆ',
    navResidents: 'ದುರ್ಬಲ ನಿವಾಸಿಗಳು',
    navCheckins: 'ಕ್ಷೇಮ ಪರಿಶೀಲನೆಗಳು',
    navRequests: 'ಸಹಾಯ ವಿನಂತಿಗಳು',
    navAdmin: 'ಆಡಳಿತ ಮಂಡಳಿ',
    navAnalytics: 'ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವರದಿಗಳು',
    navPortal: 'ನಿವಾಸಿಗಳ ಪೋರ್ಟಲ್',
    navLogin: 'ಲಾಗಿನ್ ಮಾಡಿ',
    navLogout: 'ಲಾಗ್ ಔಟ್',
    navSignUp: 'ನೋಂದಣಿ ಮಾಡಿ',
    
    // Disclaimer
    medicalDisclaimer: 'ಸೂಚನೆ: ಹೀಟ್‌ಶೀಲ್ಡ್ ಎಐ ಪರಿಸರ ತಾಪಮಾನದ ಅಪಾಯ ಮತ್ತು ಸಮುದಾಯದ ದುರ್ಬಲತೆಯನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡುತ್ತದೆ. ಇದು ಯಾವುದೇ ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ.',
    medicalDisclaimerShort: 'ಪರಿಸರ ಅಪಾಯದ ಸಲಹೆ. ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ ಅಥವಾ 108/112 ತುರ್ತು ಸೇವೆಗೆ ಬದಲಿಯಲ್ಲ.',
    
    // Roles
    roleAdmin: 'ನಿರ್ವಾಹಕರು',
    roleVolunteer: 'ಸಮುದಾಯ ಸ್ವಯಂಸೇವಕ',
    roleResident: 'ನಿವಾಸಿ / ಸಮುದಾಯ ಸದಸ್ಯ',
    
    // Risk Categories
    riskLow: 'ಕಡಿಮೆ ಅಪಾಯ',
    riskModerate: 'ಮಧ್ಯಮ ಅಪಾಯ',
    riskHigh: 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
    riskCritical: 'ತೀವ್ರ ಶಾಖದ ಅಪಾಯ',
    
    // Statuses
    statusPending: 'ಬಾಕಿ ಇರುವ ಪರಿಶೀಲನೆ',
    statusInProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    statusCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    statusUnableToContact: 'ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ',
    statusEscalated: 'ಮುಂದಿನ ಹಂತಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    
    // Request categories
    reqWater: 'ಕುಡಿಯುವ ನೀರು / ಒಆರ್‌ಎಸ್ ನೆರವು',
    reqCooling: 'ಕೂಲಿಂಗ್ ನೆರವು (ಫ್ಯಾನ್/ನೆರಳು)',
    reqWelfare: 'ಸಾಮಾನ್ಯ ಕ್ಷೇಮ ಪರಿಶೀಲನೆ',
    reqCoolingCentre: 'ಕೂಲಿಂಗ್ ಕೇಂದ್ರಕ್ಕೆ ಸಾರಿಗೆ',
    reqOther: 'ಇತರ ಸಮುದಾಯ ನೆರವು',

    // Action buttons
    btnGetStarted: 'ಪ್ರಾರಂಭಿಸಿ',
    btnViewDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಿಸಿ',
    btnSearchLocation: 'ಪ್ರದೇಶ ಹುಡುಕಿ...',
    btnSubmitRequest: 'ಸಹಾಯ ಕೋರಿಕೆ ಸಲ್ಲಿಸಿ',
    btnRecordCheckin: 'ಪರಿಶೀಲನೆ ಸ್ಥಿತಿ ದಾಖಲಿಸಿ',
    btnConfirmSafe: 'ನಾನು ಸುರಕ್ಷಿತವಾಗಿದ್ದೇನೆ',
    btnExportCsv: 'ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    btnRefreshData: 'ಹವಾಮಾನ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ',
    btnManageConsent: 'ಗೌಪ್ಯತೆ ಮತ್ತು ಸಮ್ಮತಿ ನಿರ್ವಹಣೆ',
    
    // AI Explanations
    aiAnalysisHeader: 'ಎಐ ಶಾಖ ಅಪಾಯದ ಕಾರಣಗಳ ವಿವರಣೆ',
    aiModelConfidence: 'ಎಐ ಮಾದರಿ ನಿಖರತೆ',
    aiCheckinPriority: 'ಸ್ವಯಂಸೇವಕರ ಆದ್ಯತೆ',
    contributingFactors: 'ಅಪಾಯಕ್ಕೆ ಕಾರಣವಾಗುವ ಅಂಶಗಳು',
    preventiveGuidance: 'ಶಿಫಾರಸು ಮಾಡಲಾದ ಸಮುದಾಯ ಸುರಕ್ಷತಾ ಮಾರ್ಗಸೂಚಿ',
    
    // Metrics
    metricTemp: 'ತಾಪಮಾನ',
    metricHumidity: 'ತೇವಾಂಶ',
    metricFeelsLike: 'ಅನುಭವವಾಗುವ ತಾಪಮಾನ',
    metricWetBulb: 'ವೆಟ್ ಬಲ್ಬ್ ತಾಪಮಾನ',
    metricUV: 'ಯುವಿ ಸೂಚ್ಯಂಕ',
    metricWind: 'ಗಾಳಿಯ ವೇಗ',
    
    // Prompts
    liveDataBadge: 'ಲೈವ್ ಹವಾಮಾನ ಮಾಹಿತಿ',
    simulatedDataBadge: 'ಅನುಕರಣೆಯ ಮಾಹಿತಿ',
    coolingCentres: 'ಹತ್ತಿರದ ಕೂಲಿಂಗ್ ಕೇಂದ್ರಗಳು',
  }
};

export function getTranslation(lang: SupportedLanguage, key: keyof typeof translations['en']): string {
  const dictionary = translations[lang] || translations.en;
  return dictionary[key] || translations.en[key] || key;
}
