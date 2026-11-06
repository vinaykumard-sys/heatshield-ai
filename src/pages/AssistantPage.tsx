import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Trash2, 
  PhoneCall, 
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  Languages,
  MapPin,
  Thermometer,
  Droplets,
  HeartPulse,
  Building2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sun,
  Flame,
  Footprints,
  RefreshCw,
  CornerDownLeft,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage, AssistantMessage } from '../types';
import { mockDb } from '../lib/mockDb';
import { 
  generateAssistantReply, 
  getSpeechLocale, 
  SUGGESTED_PROMPTS, 
  AssistantContext 
} from '../lib/assistantEngine';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/SkeletonLoader';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// 4 One-click resident prompts required for empty state & fast triage
interface ResidentPromptItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const RESIDENT_PROMPTS: ResidentPromptItem[] = [
  {
    id: 'peak-heat',
    title: 'What should I do during peak heat today?',
    subtitle: 'Hour-by-hour exposure guidance and indoor cooling rules',
    icon: <Sun className="w-5 h-5" />,
    iconBg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600'
  },
  {
    id: 'exhaustion-vs-stroke',
    title: 'Recognize signs of heat exhaustion vs heatstroke',
    subtitle: 'Life-saving symptom checklist & emergency protocol',
    icon: <HeartPulse className="w-5 h-5" />,
    iconBg: 'bg-red-50 border-red-100',
    iconColor: 'text-red-600'
  },
  {
    id: 'seniors-pets',
    title: 'Safe walking hours for seniors & pets',
    subtitle: 'Ground asphalt temperature & safe walking time windows',
    icon: <Footprints className="w-5 h-5" />,
    iconBg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'cooling-shelters',
    title: 'Nearby cooling shelters and hydration points',
    subtitle: 'Verified free AC refuges & potable ORS water booths',
    icon: <Building2 className="w-5 h-5" />,
    iconBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-[#1E60F2]'
  }
];

// Dedicated Loading Skeleton so page NEVER displays a blank screen
const AssistantLoadingSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Emergency banner skeleton */}
      <Skeleton className="h-14 w-full rounded-2xl" />

      {/* Main layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-6 border border-[#E5EDF5] h-[650px] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-24 w-3/4 rounded-2xl" />
              <Skeleton className="h-28 w-4/5 rounded-2xl self-end ml-auto" />
              <Skeleton className="h-24 w-2/3 rounded-2xl" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
};

const AssistantPageContent: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading, currentRisk, selectedZone } = useLocationTracker();
  const { language, setLanguage } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const getInitialWelcome = (lang: SupportedLanguage): AssistantMessage => {
    if (lang === 'hi') {
      return {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `नमस्ते! मैं आपका **HeatShield सुरक्षा सहायक** हूँ।\n\nमैं आपके क्षेत्र के गर्मी स्तर, नजदीकी शीतल आश्रय (Cooling Centres), लू से बचाव और प्राथमिक उपचार के बारे में सटीक सलाह प्रदान करता हूँ।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ? नीचे दिए गए 4 त्वरित प्रश्नों पर टैप करें या अपना प्रश्न पूछें।`,
        language: 'hi',
        created_at: new Date().toISOString()
      };
    } else if (lang === 'kn') {
      return {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ **HeatShield ಸುರಕ್ಷತಾ ಸಹಾಯಕ**.\n\nನಿಮ್ಮ ಪ್ರದೇಶದ ಶಾಖದ ಅಪಾಯ, ಹತ್ತಿರದ ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರಗಳು, ಬಿಸಿಲಿನ ರಕ್ಷಣೆ ಮತ್ತು ತುರ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆಯ ಬಗ್ಗೆ ನಿಖರ ಮಾಹಿತಿ ನೀಡಲು ನಾನಿದ್ದೇನೆ.\n\nನಾನು ನಿಮಗೆ ಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ಕೆಳಗಿನ 4 ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.`,
        language: 'kn',
        created_at: new Date().toISOString()
      };
    }
    return {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I'm your **HeatShield Safety Assistant**.\n\nI provide real-time neighborhood heat risk, nearest cooling shelters, hydration guidance, and medical safety advice in English, हिन्दी, and ಕನ್ನಡ.\n\nHow can I help you stay safe today? Select any of the 4 resident topics below or type your question.`,
      language: 'en',
      created_at: new Date().toISOString()
    };
  };

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const saved = mockDb.getAssistantMessages();
      if (Array.isArray(saved) && saved.length > 0) {
        return saved.filter(m => m && typeof m.text === 'string');
      }
    } catch (e) {
      console.warn('Failed to load saved assistant messages:', e);
    }
    return [getInitialWelcome(language)];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Brief initial loading state to ensure hydration and avoid any blank flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Speech recognition hook
  const {
    isListening,
    isSupported: speechSupported,
    permissionError,
    isNetworkBlocked,
    toggleListening: handleToggleMic,
    stopListening
  } = useSpeechRecognition({
    language,
    onInterimTranscript: (interim) => {
      setInputText(interim);
    },
    onFinalTranscript: (final) => {
      setInputText(final);
    }
  });

  const handleSpeakText = (messageId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (currentlySpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(messageId);

    // Clean markdown symbols for natural speech
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getSpeechLocale(language);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Stop speech recognition
    stopListening();

    const userMessage: AssistantMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query,
      language,
      created_at: new Date().toISOString()
    };

    // Live telemetry context
    const localityName = selectedZone?.name || currentLocation?.localityName || 'Bengaluru Urban';
    const currentTemp = currentReading?.temperature_c ?? 34.5;
    const apparentTemp = currentReading?.heat_index_c ?? (currentTemp + 2.5);
    const humidity = currentReading?.relative_humidity_pct ?? 52;
    const riskScore = currentRisk?.risk_score ?? 65;
    const riskCategory = currentRisk?.risk_category ?? 'high';

    const centres = mockDb.getCoolingCentres();
    const nearestCoolingCentre = centres.length > 0 ? centres[0] : null;

    const forecasts = mockDb.getForecasts();
    const forecast24h = forecasts.find(f => f.forecast_horizon_hours === 24) || null;

    const ctx: AssistantContext = {
      localityName,
      currentTemp,
      apparentTemp,
      humidity,
      riskScore,
      riskCategory,
      nearestCoolingCentre,
      forecast24h
    };

    try {
      const reply = generateAssistantReply(query, language, ctx);

      const botMessage: AssistantMessage = {
        id: `msg-b-${Date.now() + 1}`,
        sender: 'assistant',
        text: reply.text,
        language,
        intent: reply.intent,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      mockDb.saveAssistantMessage(userMessage);
      setInputText('');
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, botMessage]);
        mockDb.saveAssistantMessage(botMessage);

        if (reply.audioRecommended || isListening) {
          setTimeout(() => {
            handleSpeakText(botMessage.id, botMessage.text);
          }, 300);
        }
      }, 400);
    } catch (err) {
      console.error('Error generating reply:', err);
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      mockDb.clearAssistantMessages();
      setMessages([]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeakingId(null);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setMessages([getInitialWelcome(language)]);
  };

  // Only consider empty if no messages at all, or only 1 welcome message
  const hasUserInteraction = messages.some(m => m.sender === 'user');

  // Filter suggested prompts for active language
  const suggestedPrompts = SUGGESTED_PROMPTS.filter(p => p.language === language);

  const localityName = selectedZone?.name || currentLocation?.localityName || 'Bengaluru Urban';
  const currentTemp = currentReading?.temperature_c ?? 34.5;
  const apparentTemp = currentReading?.heat_index_c ?? (currentTemp + 2.5);
  const humidity = currentReading?.relative_humidity_pct ?? 52;
  const riskCategory = currentRisk?.risk_category ?? 'high';
  const centres = mockDb.getCoolingCentres();
  const nearestCentre = centres[0];

  if (isLoading) {
    return <AssistantLoadingSkeleton />;
  }

  if (hasError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Assistant State Error</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          We experienced an issue restoring your previous conversation. You can retry with a fresh assistant session.
        </p>
        <Button variant="primary" onClick={handleRetry} icon={<RefreshCw className="w-4 h-4" />}>
          Restore Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E60F2] shadow-xs">
                <Bot className="w-5 h-5 text-[#1E60F2]" />
              </span>
              <span>AI Heat Safety Assistant</span>
            </h1>
            <Badge variant="primary" dot>
              Live Resident Advisor
            </Badge>
            <Badge variant="subtle" className="text-slate-600">
              <MapPin className="w-3 h-3 text-[#1E60F2]" />
              {localityName}
            </Badge>
          </div>
          <p className="text-sm text-[#64748B] max-w-2xl leading-relaxed">
            Instant, multilingual guidance on neighborhood heat conditions, cooling shelters, hydration alerts, and medical safety.
          </p>
        </div>

        {/* Action Controls: Language Pill Selector & Clear Chat */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E5EDF5] rounded-2xl shadow-xs">
            <Languages className="w-4 h-4 text-[#64748B] ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                language === 'en'
                  ? 'bg-[#1E60F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                language === 'hi'
                  ? 'bg-[#1E60F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                language === 'kn'
                  ? 'bg-[#1E60F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          {/* Clear history */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-slate-600 hover:text-red-600 hover:border-red-200 rounded-xl"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Emergency Medical Care Strip */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-red-50/80 border border-red-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3 text-red-950">
          <div className="w-9 h-9 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 text-red-600 shadow-2xs">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-red-900 block sm:inline">
              Emergency Medical Protocol:
            </span>
            <span className="text-red-800 sm:ml-1.5">
              For heatstroke, loss of consciousness, disorientation, or cessation of sweating, call dispatch immediately.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-red-200 font-bold text-red-700 hover:bg-red-50 shadow-xs transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112 (National EMS)</span>
          </a>
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-red-200 font-bold text-red-700 hover:bg-red-50 shadow-xs transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>108 (Ambulance)</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Chat Stream (8 cols) + Context & Safety Insights (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Chat Area: 8 Columns */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Rounded-3xl soft-card chat container matching SkySense/Horizon aesthetic */}
          <div className="flex flex-col h-[680px] bg-white rounded-3xl border border-[#E5EDF5] shadow-card overflow-hidden">
            {/* Chat Top Subheader */}
            <div className="px-6 py-4 bg-white border-b border-[#E5EDF5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E60F2] shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -top-0.5 -right-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">
                    HeatShield Intelligent Safety Assistant
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Context-aware thermal guidance • English • हिन्दी • ಕನ್ನಡ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={riskCategory === 'critical' ? 'danger' : riskCategory === 'high' ? 'warning' : 'success'}
                  size="sm"
                  dot
                >
                  {riskCategory.toUpperCase()} RISK
                </Badge>
              </div>
            </div>

            {/* Message Stream or Clean Empty State */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#FBFDFF] to-white">
              {/* If no user messages yet, show the Clean Empty State with 4 Prompts */}
              {!hasUserInteraction ? (
                <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-2 space-y-6 animate-fade-in">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-3xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center mx-auto shadow-xs ring-8 ring-blue-50/50">
                      <Bot className="w-7 h-7" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                      How can I help you stay heat-safe today?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                      Tap any of the 4 resident topics below for instantaneous neighborhood heat advice, or type your custom question.
                    </p>
                  </div>

                  {/* 4 ONE-CLICK RESIDENT PROMPTS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {RESIDENT_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        onClick={() => handleSendMessage(prompt.title)}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1E60F2] text-left transition-all duration-200 shadow-xs hover:shadow-md hover:translate-y-[-2px] group flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <span className={`w-9 h-9 rounded-xl ${prompt.iconBg} ${prompt.iconColor} border flex items-center justify-center shrink-0 shadow-2xs`}>
                            {prompt.icon}
                          </span>
                          <div className="space-y-0.5">
                            <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#1E60F2] transition-colors leading-snug">
                              {prompt.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              {prompt.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end text-[11px] font-semibold text-[#1E60F2] pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Ask assistant <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message History List */
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSpeaking = currentlySpeakingId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 animate-card-enter ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#1E60F2] text-white rounded-tr-xs shadow-md font-normal'
                            : msg.intent === 'medical_emergency' || msg.intent === 'medical_guidance'
                            ? 'bg-red-50/80 text-[#0F172A] border border-red-200 rounded-tl-xs shadow-xs'
                            : 'bg-white text-[#0F172A] border border-[#E5EDF5] rounded-tl-xs shadow-card'
                        }`}
                      >
                        {/* Message Content */}
                        <div className="whitespace-pre-line space-y-2">
                          {(msg.text || '').split('\n').map((line, idx) => {
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return (
                                <div
                                  key={idx}
                                  className={`font-bold ${isUser ? 'text-white' : 'text-[#0F172A]'}`}
                                >
                                  {line.replace(/\*\*/g, '')}
                                </div>
                              );
                            }
                            if (
                              line.startsWith('•') ||
                              line.startsWith('1.') ||
                              line.startsWith('2.') ||
                              line.startsWith('3.') ||
                              line.startsWith('4.') ||
                              line.startsWith('5.')
                            ) {
                              return (
                                <div key={idx} className="pl-2 font-normal">
                                  {line}
                                </div>
                              );
                            }
                            return <div key={idx}>{line}</div>;
                          })}
                        </div>

                        {/* Message Footer: Timestamp and Voice playback toggle */}
                        <div
                          className={`mt-3 pt-2.5 flex items-center justify-between text-[11px] ${
                            isUser
                              ? 'text-blue-100/90 border-t border-white/20'
                              : 'text-[#64748B] border-t border-[#E5EDF5]'
                          }`}
                        >
                          <span>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Just now'}
                          </span>

                          {!isUser && (
                            <button
                              type="button"
                              onClick={() => handleSpeakText(msg.id, msg.text)}
                              className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg transition-colors ${
                                isSpeaking
                                  ? 'bg-blue-100 text-[#1E60F2] font-semibold'
                                  : 'hover:text-[#1E60F2] hover:bg-slate-50 text-[#64748B]'
                              }`}
                              title={isSpeaking ? 'Stop speaking' : 'Listen via voice'}
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-[#1E60F2] animate-pulse" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Read Aloud</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-[#E5EDF5] rounded-3xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-typing-1" />
                    <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-typing-2" />
                    <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-typing-3" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E5EDF5] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60F2]" />
                Suggested:
              </span>
              {suggestedPrompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSendMessage(p.text)}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5EDF5] text-slate-700 hover:border-[#1E60F2] hover:text-[#1E60F2] whitespace-nowrap text-xs font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95"
                >
                  {p.text}
                </button>
              ))}
            </div>

            {/* Input Bar with Mic & Send */}
            <div className="p-4 sm:p-5 bg-white border-t border-[#E5EDF5] space-y-2.5">
              {permissionError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{permissionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className="px-3 py-1 rounded-xl bg-red-600 text-white font-semibold text-xs shrink-0 hover:bg-red-700 transition-colors shadow-xs"
                  >
                    Allow Mic
                  </button>
                </div>
              )}

              {isNetworkBlocked && (
                <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold">
                      <Info className="w-4 h-4 text-[#1E60F2] shrink-0" />
                      <span>Browser Speech Service Notice</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleMic}
                      className="px-2.5 py-1 rounded-lg bg-[#1E60F2] text-white text-[11px] font-semibold hover:bg-[#184FD0] transition-colors"
                    >
                      Retry Voice
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Voice speech recognition was blocked by browser shields. You can type or tap any question below — answers will still be spoken aloud!
                  </p>
                </div>
              )}

              {/* Listening Waveform Indicator */}
              {isListening && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-red-50/90 border border-red-200 text-xs text-red-900 animate-fade-in shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 h-5 px-1 bg-white/60 rounded-md py-0.5 border border-red-200">
                      <span className="w-1 bg-red-600 rounded-full h-2.5 animate-waveform-1" />
                      <span className="w-1 bg-red-600 rounded-full h-5 animate-waveform-2" />
                      <span className="w-1 bg-red-600 rounded-full h-3 animate-waveform-3" />
                      <span className="w-1 bg-red-600 rounded-full h-4.5 animate-waveform-4" />
                      <span className="w-1 bg-red-600 rounded-full h-2 animate-waveform-2" />
                    </div>
                    <div>
                      <span className="font-bold text-red-950 block sm:inline">
                        Listening ({language === 'hi' ? 'हिन्दी' : language === 'kn' ? 'ಕನ್ನಡ' : 'English'}):
                      </span>
                      <span className="text-[11px] text-red-700 sm:ml-1.5">
                        Speak clearly — your words appear live in the input box
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopListening();
                        if (inputText.trim()) handleSendMessage();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      Done Speaking → Send
                    </button>
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2.5"
              >
                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                      if (inputText.trim()) {
                        handleSendMessage(inputText);
                      }
                    } else {
                      handleToggleMic();
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-center shrink-0 active:scale-95 ${
                    isListening
                      ? 'bg-red-600 text-white border-red-600 animate-pulse ring-4 ring-red-100 shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-[#E5EDF5] hover:border-[#1E60F2] shadow-xs'
                  }`}
                  title={isListening ? 'Click to finish speaking and send' : 'Tap to speak your question'}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-[#1E60F2]" />
                  )}
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening... words will appear here live...'
                      : language === 'hi'
                      ? 'गर्मी जोखिम, शीतल आश्रय या प्राथमिक उपचार के बारे में पूछें...'
                      : language === 'kn'
                      ? 'ಶಾಖದ ಅಪಾಯ, ಶೀತಲ ಆಶ್ರಯ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸೆ ಬಗ್ಗೆ ಕೇಳಿ...'
                      : 'Ask about current heat risk, forecast, cooling shelters, or emergency safety...'
                  }
                  className={`flex-1 border rounded-2xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none transition-all duration-150 ${
                    isListening
                      ? 'bg-red-50/40 border-red-300 ring-2 ring-red-100'
                      : 'bg-[#F8FAFC] border-[#E5EDF5] focus:bg-white focus:border-[#1E60F2] focus:ring-4 focus:ring-blue-100'
                  }`}
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  variant="primary"
                  size="md"
                  className="rounded-2xl px-5 py-3 shadow-sm"
                  icon={<Send className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right / Safety Context & Local Intelligence: 4 Columns */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Neighborhood Telemetry Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EDF5] shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shadow-2xs">
                  <Thermometer className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-xs text-[#0F172A]">Live Telemetry Context</h4>
                  <p className="text-[10px] text-[#64748B]">Hyperlocal data informing assistant</p>
                </div>
              </div>
              <Badge variant="subtle" size="sm">
                Live
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-[#E5EDF5]">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
                  <span>Monitored Zone</span>
                </div>
                <span className="text-xs font-bold text-[#0F172A]">{localityName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E5EDF5]">
                  <span className="text-[11px] text-[#64748B] block">Current Temp</span>
                  <span className="text-lg font-black text-[#0F172A]">{Math.round(currentTemp)}°C</span>
                  <span className="text-[10px] text-[#64748B] block">Feels like {Math.round(apparentTemp)}°C</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E5EDF5]">
                  <span className="text-[11px] text-[#64748B] block">Relative Humidity</span>
                  <span className="text-lg font-black text-[#1E60F2]">{Math.round(humidity)}%</span>
                  <span className="text-[10px] text-[#64748B] block">Atmospheric index</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E5EDF5] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Heat Risk Classification</span>
                  <span className="text-xs font-bold text-[#0F172A] capitalize">{riskCategory} Risk Level</span>
                </div>
                <Badge
                  variant={riskCategory === 'critical' ? 'danger' : riskCategory === 'high' ? 'warning' : 'success'}
                  size="sm"
                >
                  {riskCategory.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Nearest Cooling Centre Card */}
          {nearestCentre && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EDF5] shadow-card space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5EDF5]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-[#0F172A]">Nearest Cooling Shelter</h4>
                    <p className="text-[10px] text-[#64748B]">Verified free air-conditioned refuge</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  Open Now
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-[#0F172A] text-sm">{nearestCentre.name}</p>
                <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1E60F2] shrink-0" />
                  <span>{nearestCentre.address}</span>
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-[#64748B]">Distance: ~{nearestCentre.distance_km || 1.2} km</span>
                  <span className="text-emerald-700 font-bold">Free Water & ORS</span>
                </div>
              </div>
            </div>
          )}

          {/* Safe Living Guidance Pill Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5EDF5] shadow-card space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EDF5]">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E60F2] flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-xs text-[#0F172A]">Quick Resident Guidance</h4>
                <p className="text-[10px] text-[#64748B]">Key actions during peak hours</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#0F172A]">
              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFC]">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1E60F2] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-bold block">Hydration Goal</span>
                  <span className="text-[11px] text-[#64748B]">Drink at least 250ml water every 30 minutes.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFC]">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-bold block">Peak Sun Hours</span>
                  <span className="text-[11px] text-[#64748B]">Avoid strenuous outdoor exertion from 11:30 AM - 3:30 PM.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFC]">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-bold block">Elderly & Pet Care</span>
                  <span className="text-[11px] text-[#64748B]">Test asphalt with your hand before walking pets outdoors.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AssistantPage: React.FC = () => {
  return (
    <ErrorBoundary
      fallbackTitle="HeatShield AI Safety Assistant Temporarily Unavailable"
      fallbackMessage="We encountered an unexpected display issue with the AI Assistant. You can still access live heat risk updates, cooling centres, and community aid."
    >
      <AssistantPageContent />
    </ErrorBoundary>
  );
};

export default AssistantPage;
