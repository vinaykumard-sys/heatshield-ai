import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sparkles,
  PhoneCall,
  Languages,
  AlertTriangle,
  Info,
  MapPin,
  HeartPulse,
  Sun,
  Footprints,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocationTracker } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { AssistantMessage, SupportedLanguage } from '../../types';
import { mockDb } from '../../lib/mockDb';
import { generateAssistantReply, getSpeechLocale, AssistantContext } from '../../lib/assistantEngine';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Badge } from '../common/Badge';
import { AssistantOrb3D } from '../3d/AssistantOrb3D';

// 4 One-click resident prompts for widget empty state and quick action
const WIDGET_PROMPTS = [
  {
    id: 'peak-heat',
    title: 'Peak Heat Routine',
    text: 'What should I do during peak heat today?',
    icon: <Sun className="w-3.5 h-3.5 text-amber-600" />,
    badgeBg: 'bg-amber-50 border-amber-100 text-amber-800'
  },
  {
    id: 'exhaustion-vs-stroke',
    title: 'Exhaustion vs Stroke',
    text: 'Recognize signs of heat exhaustion vs heatstroke',
    icon: <HeartPulse className="w-3.5 h-3.5 text-red-600" />,
    badgeBg: 'bg-red-50 border-red-100 text-red-800'
  },
  {
    id: 'seniors-pets',
    title: 'Seniors & Pets Hours',
    text: 'Safe walking hours for seniors & pets',
    icon: <Footprints className="w-3.5 h-3.5 text-emerald-600" />,
    badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-800'
  },
  {
    id: 'cooling-shelters',
    title: 'Cooling Shelters',
    text: 'Nearby cooling shelters and hydration points',
    icon: <Building2 className="w-3.5 h-3.5 text-[#1E60F2]" />,
    badgeBg: 'bg-blue-50 border-blue-100 text-blue-800'
  }
];

export const FloatingAssistantWidget: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLocation, currentReading, currentRisk, selectedZone } = useLocationTracker();
  const { language, setLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    try {
      const list = mockDb.getAssistantMessages();
      if (Array.isArray(list) && list.length > 0) {
        return list.slice(-8);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Robust speech recognition hook with keep-alive
  const {
    isListening,
    permissionError,
    isNetworkBlocked,
    toggleListening: handleToggleVoice,
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

  const speakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(id);

    const clean = text.replace(/[*#_`>]/g, '').replace(/\n+/g, '. ');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = getSpeechLocale(language);
    utt.onend = () => setSpeakingId(null);
    utt.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utt);
  };

  const handleSend = (text?: string) => {
    const query = (text || inputText).trim();
    if (!query) return;

    // Stop listening on query submit
    stopListening();

    const userMsg: AssistantMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query,
      language,
      created_at: new Date().toISOString()
    };

    const localityName = selectedZone?.name || currentLocation?.localityName || 'Bengaluru Urban';
    const currentTemp = currentReading?.temperature_c ?? 34.5;
    const apparentTemp = currentReading?.heat_index_c ?? (currentTemp + 2.5);
    const humidity = currentReading?.relative_humidity_pct ?? 52;
    const riskScore = currentRisk?.risk_score ?? 65;
    const riskCategory = currentRisk?.risk_category ?? 'high';

    const centres = mockDb.getCoolingCentres();
    const nearestCoolingCentre = centres.length > 0 ? centres[0] : null;

    const ctx: AssistantContext = {
      localityName,
      currentTemp,
      apparentTemp,
      humidity,
      riskScore,
      riskCategory,
      nearestCoolingCentre
    };

    const reply = generateAssistantReply(query, language, ctx);

    const botMsg: AssistantMessage = {
      id: `msg-b-${Date.now() + 1}`,
      sender: 'assistant',
      text: reply.text,
      language,
      intent: reply.intent,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    mockDb.saveAssistantMessage(userMsg);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
      mockDb.saveAssistantMessage(botMsg);

      if (reply.audioRecommended || isListening) {
        setTimeout(() => speakText(botMsg.id, botMsg.text), 300);
      }
    }, 400);
  };

  // Only hide rendering when on the dedicated assistant page, after all hooks have executed
  if (location.pathname === '/assistant') {
    return null;
  }

  return (
    <aside aria-label="AI Assistant" className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-auto">
      {/* Floating 3D Interactive Assistant Orb (Visible when closed) */}
      {!isOpen && (
        <div className="flex flex-col items-end">
          <AssistantOrb3D
            onClick={() => setIsOpen(true)}
            isOpen={isOpen}
            isListening={isListening}
            isTyping={isTyping}
            isSpeaking={!!speakingId}
            size={72}
            hasUnread={messages.length > 0}
          />
        </div>
      )}

      {/* Floating Chat Panel (Visible when open) - Rounded-3xl soft-card container */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[540px] sm:h-[600px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] bg-white border border-[#E5EDF5] rounded-3xl shadow-[0_20px_45px_-10px_rgba(15,23,42,0.18),0_8px_16px_-4px_rgba(15,23,42,0.08)] flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-white border-b border-[#E5EDF5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E60F2] shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white absolute -top-0.5 -right-0.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-[#0F172A] tracking-tight">HeatShield AI</h3>
                <p className="text-[10px] text-[#64748B]">Live Safety Advisor</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language toggle pills */}
              <div className="flex items-center bg-[#F8FAFC] border border-[#E5EDF5] rounded-xl p-0.5 text-[10px]">
                {(['en', 'hi', 'kn'] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all duration-150 ${
                      language === l
                        ? 'bg-[#1E60F2] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Expand to full page */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/assistant');
                }}
                className="p-1.5 text-slate-400 hover:text-[#1E60F2] hover:bg-blue-50 rounded-xl transition-colors"
                title="Open Fullscreen Assistant"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setSpeakingId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Helplines Banner */}
          <div className="px-3.5 py-1.5 bg-red-50/80 border-b border-red-100 flex items-center justify-between text-[11px] text-red-900 font-medium">
            <span className="flex items-center gap-1 font-bold">
              <HeartPulse className="w-3 h-3 text-red-600" />
              <span>Emergency:</span>
            </span>
            <div className="flex items-center gap-2 font-bold">
              <a href="tel:112" className="text-red-700 hover:underline">112 EMS</a>
              <span>•</span>
              <a href="tel:108" className="text-red-700 hover:underline">108 Ambulance</a>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-[#FBFDFF] to-white">
            {/* If no user messages yet, show Clean Empty State with the 4 Resident Prompts */}
            {messages.length === 0 ? (
              <div className="py-3 px-1 space-y-4 animate-fade-in">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center mx-auto shadow-2xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0F172A]">HeatShield Assistant</h4>
                  <p className="text-[11px] text-[#64748B] max-w-[260px] mx-auto leading-tight">
                    Instant advice on heatstroke prevention, cooling shelters, and peak heat safety.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {WIDGET_PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSend(p.text)}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1E60F2] text-left transition-all duration-150 shadow-2xs hover:shadow-xs group flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {p.icon}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 group-hover:text-[#1E60F2] block leading-tight">
                            {p.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[210px]">
                            {p.text}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E60F2] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(m => {
                const isUser = m.sender === 'user';
                const isSpeaking = speakingId === m.id;

                return (
                  <div key={m.id} className={`flex gap-2 animate-card-enter ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed transition-all shadow-2xs ${
                        isUser
                          ? 'bg-[#1E60F2] text-white rounded-tr-xs font-normal'
                          : m.intent === 'medical_emergency' || m.intent === 'medical_guidance'
                          ? 'bg-red-50/80 text-[#0F172A] border border-red-200 rounded-tl-xs'
                          : 'bg-white text-[#0F172A] border border-[#E5EDF5] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line space-y-1">
                        {m.text.split('\n').map((line, idx) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <div key={idx} className={`font-bold ${isUser ? 'text-white' : 'text-[#0F172A]'}`}>
                                {line.replace(/\*\*/g, '')}
                              </div>
                            );
                          }
                          return <div key={idx}>{line}</div>;
                        })}
                      </div>

                      {!isUser && (
                        <div className="mt-2 pt-1.5 border-t border-[#E5EDF5] flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => speakText(m.id, m.text)}
                            className={`text-[10px] font-medium flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded ${
                              isSpeaking
                                ? 'bg-blue-100 text-[#1E60F2] font-semibold'
                                : 'text-[#64748B] hover:text-[#1E60F2]'
                            }`}
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="w-3 h-3 text-[#1E60F2] animate-pulse" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Read</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start animate-fade-in">
                <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 text-[#1E60F2] flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-white border border-[#E5EDF5] rounded-2xl rounded-tl-xs px-3 py-2 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2] animate-typing-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2] animate-typing-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E60F2] animate-typing-3" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips featuring the 4 core topics */}
          <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#E5EDF5] flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {WIDGET_PROMPTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSend(p.text)}
                className="px-2.5 py-1 rounded-full bg-white border border-[#E5EDF5] text-slate-700 hover:border-[#1E60F2] hover:text-[#1E60F2] whitespace-nowrap shadow-2xs font-semibold transition-all active:scale-95 flex items-center gap-1"
              >
                {p.icon}
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-white border-t border-[#E5EDF5] space-y-2">
            {permissionError && (
              <p className="text-[10px] text-red-700 bg-red-50 p-1.5 rounded-xl border border-red-200">
                {permissionError}
              </p>
            )}

            {isNetworkBlocked && (
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-900 flex items-center justify-between gap-1">
                <span className="truncate">Speech service unreachable. Type or use questions above.</span>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className="px-2 py-0.5 rounded-lg bg-[#1E60F2] text-white text-[10px] font-semibold shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {isListening && (
              <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-800 animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 h-3.5 px-0.5 bg-white/60 rounded">
                    <span className="w-1 bg-red-600 rounded-full h-2 animate-waveform-1" />
                    <span className="w-1 bg-red-600 rounded-full h-3.5 animate-waveform-2" />
                    <span className="w-1 bg-red-600 rounded-full h-1.5 animate-waveform-3" />
                    <span className="w-1 bg-red-600 rounded-full h-3 animate-waveform-4" />
                  </div>
                  <span className="font-bold text-xs text-red-950">Listening... speak clearly</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (inputText.trim()) handleSend();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] shadow-xs active:scale-95"
                >
                  Done → Send
                </button>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              {/* Mic Button */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                    if (inputText.trim()) handleSend();
                  } else {
                    handleToggleVoice();
                  }
                }}
                className={`p-2 rounded-2xl border transition-all duration-150 active:scale-95 ${
                  isListening
                    ? 'bg-red-600 text-white border-red-600 animate-pulse ring-2 ring-red-200 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-[#E5EDF5] hover:border-[#1E60F2] shadow-2xs'
                }`}
                title={isListening ? 'Click to finish speaking and send' : 'Tap to speak'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4 text-[#1E60F2]" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening... words appear live...'
                    : language === 'hi'
                    ? 'गर्मी, शीतल आश्रय के बारे में पूछें...'
                    : language === 'kn'
                    ? 'ಶಾಖದ ಅಪಾಯ, ಶೀತಲ ಆಶ್ರಯ ಕೇಳಿ...'
                    : 'Ask about heat risk, shelters, safety...'
                }
                className={`flex-1 border rounded-2xl px-3 py-2 text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none transition-all duration-150 ${
                  isListening
                    ? 'bg-red-50/40 border-red-300 ring-1 ring-red-100'
                    : 'bg-[#F8FAFC] border-[#E5EDF5] focus:bg-white focus:border-[#1E60F2] focus:ring-2 focus:ring-blue-100'
                }`}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-2xl bg-[#1E60F2] hover:bg-[#184FD0] disabled:opacity-40 text-white shadow-xs transition-all active:scale-95"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default FloatingAssistantWidget;
