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
  ShieldAlert
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

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading, currentRisk, selectedZone } = useLocationTracker();
  const { language, setLanguage } = useLanguage();

  const getInitialWelcome = (lang: SupportedLanguage): AssistantMessage => {
    if (lang === 'hi') {
      return {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `नमस्ते! मैं आपका **HeatShield सुरक्षा सहायक** हूँ।\n\nमैं आपके क्षेत्र के गर्मी स्तर, नजदीकी शीतल आश्रय (Cooling Centres), लू से बचाव और प्राथमिक उपचार के बारे में सटीक सलाह प्रदान करता हूँ।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ? नीचे दिए गए सुझावों पर टैप करें या अपना प्रश्न पूछें।`,
        language: 'hi',
        created_at: new Date().toISOString()
      };
    } else if (lang === 'kn') {
      return {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ **HeatShield ಸುರಕ್ಷತಾ ಸಹಾಯಕ**.\n\nನಿಮ್ಮ ಪ್ರದೇಶದ ಶಾಖದ ಅಪಾಯ, ಹತ್ತಿರದ ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರಗಳು, ಬಿಸಿಲಿನ ರಕ್ಷಣೆ ಮತ್ತು ತುರ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸೆಯ ಬಗ್ಗೆ ನಿಖರ ಮಾಹಿತಿ ನೀಡಲು ನಾನಿದ್ದೇನೆ.\n\nನಾನು ನಿಮಗೆ ಇಂದು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.`,
        language: 'kn',
        created_at: new Date().toISOString()
      };
    }
    return {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I'm your **HeatShield Safety Assistant**.\n\nI'm here to provide real-time neighborhood heat risk, nearest cooling shelters, hydration guidance, and medical safety advice in English, हिन्दी, and ಕನ್ನಡ.\n\nHow can I help you stay safe today? Tap a suggested question below or type your question.`,
      language: 'en',
      created_at: new Date().toISOString()
    };
  };

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const saved = mockDb.getAssistantMessages();
    if (saved.length > 0) return saved;
    return [getInitialWelcome(language)];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Speech recognition hook with keep-alive
  const {
    isListening,
    isSupported: speechSupported,
    permissionError,
    isNetworkBlocked,
    networkError,
    toggleListening: handleToggleMic,
    stopListening,
    startListening
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

    // Stop listening when sending
    stopListening();

    const userMessage: AssistantMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query,
      language,
      created_at: new Date().toISOString()
    };

    // Live context from application state
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

      // If audio is recommended (e.g. emergency) or user used voice input, read out response
      if (reply.audioRecommended || isListening) {
        setTimeout(() => {
          handleSpeakText(botMessage.id, botMessage.text);
        }, 300);
      }
    }, 450);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      mockDb.clearAssistantMessages();
      setMessages([getInitialWelcome(language)]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeakingId(null);
    }
  };

  // Filter suggested prompts for active language
  const suggestedPrompts = SUGGESTED_PROMPTS.filter(p => p.language === language);

  const localityName = selectedZone?.name || currentLocation?.localityName || 'Bengaluru Urban';
  const currentTemp = currentReading?.temperature_c ?? 34.5;
  const apparentTemp = currentReading?.heat_index_c ?? (currentTemp + 2.5);
  const humidity = currentReading?.relative_humidity_pct ?? 52;
  const riskCategory = currentRisk?.risk_category ?? 'high';
  const centres = mockDb.getCoolingCentres();
  const nearestCentre = centres[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E60F2] shadow-xs">
                <Bot className="w-5 h-5 text-[#1E60F2]" />
              </span>
              <span>AI Heat Safety Assistant</span>
            </h1>
            <Badge variant="primary" dot>
              Live Advisor
            </Badge>
            <Badge variant="subtle" className="text-slate-600">
              <MapPin className="w-3 h-3 text-[#1E60F2]" />
              {localityName}
            </Badge>
          </div>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Friendly, multilingual guidance on neighborhood heat conditions, cooling shelters, hydration alerts, and medical safety.
          </p>
        </div>

        {/* Action Controls: Language Pill Selector & Clear Chat */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E5EDF5] rounded-xl shadow-xs">
            <Languages className="w-4 h-4 text-[#64748B] ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
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
            className="text-slate-600 hover:text-red-600 hover:border-red-200"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Emergency Medical Care Strip */}
      <div className="p-3.5 sm:p-4 rounded-[20px] bg-red-50/70 border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3 text-red-950">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-red-900 block sm:inline">
              Medical Emergency Protocol:
            </span>
            <span className="text-red-800 sm:ml-1.5">
              For heatstroke, loss of consciousness, confusion, or severe vomiting, contact emergency medical dispatch immediately.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 font-bold text-red-700 hover:bg-red-50 hover:border-red-300 shadow-xs transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>112 (National EMS)</span>
          </a>
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 font-bold text-red-700 hover:bg-red-50 hover:border-red-300 shadow-xs transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>108 (Ambulance)</span>
          </a>
          <a
            href="tel:1070"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>1070 (Disaster)</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Chat Stream (8 cols) + Context & Safety Insights (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Chat Area: 8 Columns */}
        <div className="lg:col-span-8 flex flex-col">
          <Card padding="none" className="flex flex-col h-[650px] overflow-hidden border-[#E5EDF5] shadow-card">
            {/* Chat Top Subheader */}
            <div className="px-5 py-3.5 bg-white border-b border-[#E5EDF5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E60F2] shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -top-0.5 -right-0.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A] tracking-tight flex items-center gap-1.5">
                    HeatShield Conversational Assistant
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Context-aware heat safety • English • हिन्दी • ಕನ್ನಡ
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

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
              {messages.map((msg) => {
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
                      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#1E60F2] text-white rounded-tr-xs shadow-sm font-normal'
                          : msg.intent === 'medical_emergency'
                          ? 'bg-red-50/80 text-[#0F172A] border border-red-200 rounded-tl-xs shadow-xs'
                          : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E5EDF5] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-line space-y-1.5">
                        {msg.text.split('\n').map((line, idx) => {
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
                        className={`mt-2.5 pt-2 flex items-center justify-between text-[11px] ${
                          isUser
                            ? 'text-blue-100/90 border-t border-white/20'
                            : 'text-[#64748B] border-t border-[#E5EDF5]'
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleSpeakText(msg.id, msg.text)}
                            className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-lg transition-colors ${
                              isSpeaking
                                ? 'bg-blue-100 text-[#1E60F2] font-semibold'
                                : 'hover:text-[#1E60F2] hover:bg-white text-[#64748B]'
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
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E5EDF5] rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-typing-1" />
                    <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-typing-2" />
                    <span className="w-2 h-2 rounded-full bg-[#1E60F2] animate-typing-3" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E5EDF5] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#1E60F2]" />
                Suggested:
              </span>
              {suggestedPrompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSendMessage(p.text)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E5EDF5] text-slate-700 hover:border-[#1E60F2] hover:text-[#1E60F2] whitespace-nowrap text-xs font-medium transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95"
                >
                  {p.text}
                </button>
              ))}
            </div>

            {/* Input Bar with Mic & Send */}
            <div className="p-3 sm:p-4 bg-white border-t border-[#E5EDF5] space-y-2.5">
              {permissionError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{permissionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold text-xs shrink-0 hover:bg-red-700 transition-colors shadow-xs"
                  >
                    Allow Mic
                  </button>
                </div>
              )}

              {isNetworkBlocked && (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 space-y-2 animate-fade-in">
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
                    Voice speech recognition was blocked by browser shields or network restrictions. You can type or tap any question below — answers will still be spoken aloud!
                  </p>
                </div>
              )}

              {/* Listening Waveform Indicator */}
              {isListening && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-900 animate-fade-in shadow-xs">
                  <div className="flex items-center gap-3">
                    {/* Live Waveform Indicator */}
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
                        Speak clearly — words appear live in the box below
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
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
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
                className="flex items-center gap-2"
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
                  className={`p-3 rounded-xl border transition-all duration-150 flex items-center justify-center shrink-0 active:scale-95 ${
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
                  className={`flex-1 border rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none transition-all duration-150 ${
                    isListening
                      ? 'bg-red-50/40 border-red-300 ring-2 ring-red-100'
                      : 'bg-[#F8FAFC] border-[#E5EDF5] focus:bg-white focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100'
                  }`}
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  variant="primary"
                  size="md"
                  className="rounded-xl px-4 py-2.5 shadow-xs"
                  icon={<Send className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right / Safety Context & Local Intelligence: 4 Columns */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Neighborhood Telemetry Card */}
          <Card padding="md" className="border-[#E5EDF5] shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#E5EDF5]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E60F2] flex items-center justify-center">
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
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EDF5]">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <MapPin className="w-3.5 h-3.5 text-[#1E60F2]" />
                  <span>Monitored Zone</span>
                </div>
                <span className="text-xs font-bold text-[#0F172A]">{localityName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EDF5]">
                  <span className="text-[11px] text-[#64748B] block">Current Temp</span>
                  <span className="text-base font-bold text-[#0F172A]">{Math.round(currentTemp)}°C</span>
                  <span className="text-[10px] text-[#64748B] block">Feels like {Math.round(apparentTemp)}°C</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EDF5]">
                  <span className="text-[11px] text-[#64748B] block">Relative Humidity</span>
                  <span className="text-base font-bold text-[#0F172A]">{Math.round(humidity)}%</span>
                  <span className="text-[10px] text-[#64748B] block">Atmospheric index</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EDF5] flex items-center justify-between">
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
          </Card>

          {/* Nearest Cooling Centre Card */}
          {nearestCentre && (
            <Card padding="md" className="border-[#E5EDF5] shadow-card">
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#E5EDF5]">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
                <p className="font-bold text-[#0F172A]">{nearestCentre.name}</p>
                <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#1E60F2] shrink-0" />
                  <span>{nearestCentre.address}</span>
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-[#64748B]">Distance: ~{nearestCentre.distance_km || 1.2} km</span>
                  <span className="text-emerald-700 font-semibold">Free Water & ORS</span>
                </div>
              </div>
            </Card>
          )}

          {/* Safe Living Guidance Pill Card */}
          <Card padding="md" className="border-[#E5EDF5] shadow-card">
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#E5EDF5]">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E60F2] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-xs text-[#0F172A]">Quick Resident Guidance</h4>
                <p className="text-[10px] text-[#64748B]">Key actions during peak hours</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#0F172A]">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F8FAFC]">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1E60F2] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-semibold block">Hydration Goal</span>
                  <span className="text-[11px] text-[#64748B]">Drink at least 250ml water every 30 minutes.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F8FAFC]">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-semibold block">Peak Sun Hours</span>
                  <span className="text-[11px] text-[#64748B]">Avoid strenuous outdoor exertion from 12 PM - 3:30 PM.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F8FAFC]">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-semibold block">Elderly & Child Care</span>
                  <span className="text-[11px] text-[#64748B]">Ensure well-ventilated rooms and check hydration often.</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
