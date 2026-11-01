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
  Languages
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocationTracker } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { AssistantMessage, SupportedLanguage } from '../../types';
import { mockDb } from '../../lib/mockDb';
import { generateAssistantReply, getSpeechLocale, AssistantContext } from '../../lib/assistantEngine';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export const FloatingAssistantWidget: React.FC = () => {
  const navigate = useNavigate();
  const { currentLocation, currentReading, currentRisk, selectedZone } = useLocationTracker();
  const { language, setLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const list = mockDb.getAssistantMessages();
    return list.slice(-10);
  });
  const [inputText, setInputText] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Use robust speech recognition with keep-alive
  const {
    isListening,
    permissionError,
    isNetworkBlocked,
    networkError,
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
    const currentTemp = currentReading?.temperature_c ?? 37.2;
    const apparentTemp = currentReading?.heat_index_c ?? (currentTemp + 2.5);
    const humidity = currentReading?.relative_humidity_pct ?? 48;
    const riskScore = currentRisk?.risk_score ?? 68;
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

    const next = [...messages, userMsg, botMsg];
    setMessages(next);
    mockDb.saveAssistantMessage(userMsg);
    mockDb.saveAssistantMessage(botMsg);
    setInputText('');

    if (reply.audioRecommended || isListening) {
      setTimeout(() => speakText(botMsg.id, botMsg.text), 300);
    }
  };

  return (
    <aside aria-label="AI Assistant" className="fixed bottom-5 right-5 z-40">
      {/* Floating Toggle Button (Visible when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          title="Open HeatShield AI Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Bot className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-xs font-bold tracking-tight">AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal (Visible when open) */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xs">HeatShield AI</h3>
                <p className="text-[10px] text-slate-300">Live Voice & Text Protection</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language toggle */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-[10px]">
                {(['en', 'hi', 'kn'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                      language === l ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Expand to full page */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/assistant');
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Open Fullscreen Assistant"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Close button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setSpeakingId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Helplines banner */}
          <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span>Heatstroke Emergency:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <a href="tel:112" className="text-red-700 hover:underline">112</a> • 
              <a href="tel:108" className="text-red-700 hover:underline">108</a> • 
              <a href="tel:1070" className="text-slate-700 hover:underline">1070</a>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-600" />
                <p className="font-semibold text-slate-700">How can I help you today?</p>
                <p className="text-[11px] text-slate-400 mt-1">Ask about heat risk, cooling centres, or emergency first aid.</p>
              </div>
            )}

            {messages.map(m => {
              const isUser = m.sender === 'user';
              const isSpeaking = speakingId === m.id;

              return (
                <div key={m.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : m.intent === 'medical_emergency'
                        ? 'bg-red-50 text-slate-900 border border-red-200 rounded-bl-none'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-end">
                        <button
                          onClick={() => speakText(m.id, m.text)}
                          className="text-[10px] font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3 text-blue-600 animate-pulse" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeaking ? 'Stop' : 'Read'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSend(language === 'hi' ? 'अभी गर्मी जोखिम क्या है?' : language === 'kn' ? 'ಈಗ ಶಾಖದ ಅಪಾಯ ಎಷ್ಟಿದೆ?' : 'What is the current heat risk?')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 whitespace-nowrap shadow-2xs"
            >
              🔥 Heat Risk
            </button>
            <button
              onClick={() => handleSend(language === 'hi' ? 'शीतल आश्रय केंद्र कहाँ है?' : language === 'kn' ? 'ಶೀತಲ ಆಶ್ರಯ ಕೇಂದ್ರ ಎಲ್ಲಿದೆ?' : 'Where is the nearest cooling centre?')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 whitespace-nowrap shadow-2xs"
            >
              ❄️ Cooling Centre
            </button>
            <button
              onClick={() => handleSend(language === 'hi' ? 'लू के लक्षण और उपचार' : language === 'kn' ? 'ಹೀಟ್‌ಸ್ಟ್ರೋಕ್ ಲಕ್ಷಣಗಳು' : 'Heatstroke symptoms')}
              className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 whitespace-nowrap shadow-2xs"
            >
              ⚠️ Heatstroke
            </button>
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-white border-t border-slate-200 space-y-1.5">
            {permissionError && (
              <p className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
                {permissionError}
              </p>
            )}

            {isNetworkBlocked && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 flex items-center justify-between gap-1">
                <span className="truncate">Speech service unreachable. Use questions above or type.</span>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-semibold shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {isListening && (
              <div className="flex items-center justify-between p-1.5 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-red-600 rounded-full animate-bounce [animation-delay:0ms] h-2.5" />
                    <span className="w-0.5 bg-red-600 rounded-full animate-bounce [animation-delay:150ms] h-3" />
                    <span className="w-0.5 bg-red-600 rounded-full animate-bounce [animation-delay:300ms] h-2" />
                  </div>
                  <span className="font-semibold">Listening... speak now</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (inputText.trim()) handleSend();
                  }}
                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]"
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
                className={`p-2 rounded-lg border transition-all ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={isListening ? 'Click to finish speaking and send' : 'Tap to speak'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening... words appear live...' : 'Type query...'}
                className={`flex-1 border rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-colors ${
                  isListening
                    ? 'bg-red-50/40 border-red-300 ring-1 ring-red-200'
                    : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'
                }`}
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-sm"
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
