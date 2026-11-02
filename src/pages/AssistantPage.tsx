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
  Languages
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

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, currentReading, currentRisk, selectedZone } = useLocationTracker();
  const { language, setLanguage } = useLanguage();

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    const saved = mockDb.getAssistantMessages();
    if (saved.length > 0) return saved;
    // Initial welcome message
    const welcomeMsg: AssistantMessage = {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I am **HeatShield AI Assistant**.\nI provide hyperlocal heat risk telemetry, heatwave predictions, cooling centre locations, and community safety guidelines in English, हिन्दी, and ಕನ್ನಡ.\n\nHow can I help you stay safe today?`,
      language: 'en',
      created_at: new Date().toISOString()
    };
    return [welcomeMsg];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Robust speech recognition hook with keep-alive & clean restart
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

    // Clean markdown symbols for clearer speech
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

    // Build context from live application state
    const localityName = selectedZone?.name || currentLocation?.localityName || 'Bengaluru Urban';
    const currentTemp = currentReading?.temperature_c ?? 37.2;
    const apparentTemp = currentReading?.heat_index_c ?? (currentTemp + 2.5);
    const humidity = currentReading?.relative_humidity_pct ?? 48;
    const riskScore = currentRisk?.risk_score ?? 68;
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
      setMessages([]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeakingId(null);
    }
  };

  // Filter suggested prompts for active language
  const suggestedPrompts = SUGGESTED_PROMPTS.filter(p => p.language === language);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <span>HeatShield Assistant</span>
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              MULTILINGUAL AI VOICE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time voice and text guidance on heat risk, forecast outlooks, cooling shelters, and medical safeguards.
          </p>
        </div>

        {/* Language selector & Clear History */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-sm text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                language === 'en'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                language === 'hi'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('kn')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                language === 'kn'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Helplines Bar */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Emergency Medical Protocol:</strong> For heatstroke, loss of consciousness or severe vomiting, dial official emergency services immediately.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="px-2.5 py-1 rounded-md bg-white border border-amber-300 font-bold text-red-600 hover:bg-red-50 shadow-sm flex items-center gap-1 transition-colors"
          >
            <PhoneCall className="w-3 h-3" />
            <span>112 (National EMS)</span>
          </a>
          <a
            href="tel:108"
            className="px-2.5 py-1 rounded-md bg-white border border-amber-300 font-bold text-red-600 hover:bg-red-50 shadow-sm flex items-center gap-1 transition-colors"
          >
            <PhoneCall className="w-3 h-3" />
            <span>108 (Ambulance)</span>
          </a>
          <a
            href="tel:1070"
            className="px-2.5 py-1 rounded-md bg-white border border-amber-300 font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-1 transition-colors"
          >
            <PhoneCall className="w-3 h-3" />
            <span>1070 (Disaster)</span>
          </a>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[560px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = currentlySpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 animate-card-enter ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : msg.intent === 'medical_emergency'
                      ? 'bg-red-50 text-slate-900 border border-red-200 rounded-bl-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* Message Content formatted with line breaks */}
                  <div className="whitespace-pre-line space-y-1">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <div key={idx} className="font-bold text-slate-900">{line.replace(/\*\*/g, '')}</div>;
                      }
                      if (line.startsWith('•') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.')) {
                        return <div key={idx} className="pl-2">{line}</div>;
                      }
                      return <div key={idx}>{line}</div>;
                    })}
                  </div>

                  {/* Message Footer: Timestamp and Voice playback toggle */}
                  <div className={`mt-2.5 pt-2 flex items-center justify-between text-[10px] ${isUser ? 'text-blue-100 border-t border-blue-500/40' : 'text-slate-400 border-t border-slate-200'}`}>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                    {!isUser && (
                      <button
                        onClick={() => handleSpeakText(msg.id, msg.text)}
                        className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded transition-colors ${
                          isSpeaking 
                            ? 'bg-blue-100 text-blue-700 font-semibold' 
                            : 'hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title={isSpeaking ? 'Stop speech' : 'Listen via Voice'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3 text-blue-600 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
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
          {/* Subtle typing indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-4 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-typing-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-typing-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-typing-3" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {suggestedPrompts.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSendMessage(p.text)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 whitespace-nowrap text-xs transition-colors shadow-xs"
            >
              {p.text}
            </button>
          ))}
        </div>

        {/* Input Bar with Mic & Send */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          {permissionError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{permissionError}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleMic}
                className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold text-[11px] shrink-0 hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {isNetworkBlocked && (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Browser speech-to-text service is unreachable.</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700"
                >
                  Retry Mic
                </button>
              </div>
              <p className="text-[11px] text-blue-700">
                {networkError || 'Google speech recognition service was blocked by your browser (e.g. Brave shields) or firewall. You can tap any question below or type — speech answers will still be spoken aloud!'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      stopListening();
                      handleSendMessage(p.text);
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-blue-300 text-blue-800 font-medium text-[11px] hover:bg-blue-100 hover:border-blue-400 transition-colors shadow-2xs"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic Button */}
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
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-red-500 text-white border-red-600 animate-pulse ring-4 ring-red-100 shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isListening ? 'Click to finish speaking and send' : 'Tap to start voice speaking'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-blue-600" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening 
                  ? 'Listening... speak clearly (words will appear live)...' 
                  : language === 'hi'
                  ? 'गर्मी जोखिम, शीतल आश्रय या प्राथमिक उपचार के बारे में पूछें...'
                  : language === 'kn'
                  ? 'ಶಾಖದ ಅಪಾಯ, ಶೀತಲ ಆಶ್ರಯ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸೆ ಬಗ್ಗೆ ಕೇಳಿ...'
                  : 'Ask about current heat risk, forecast, cooling shelters, or emergency protocols...'
              }
              className={`flex-1 border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                isListening 
                  ? 'bg-red-50/30 border-red-300 ring-1 ring-red-200' 
                  : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold transition-colors shadow-sm"
              title="Send query"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {isListening && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                {/* Smooth visualizer waveform */}
                <div className="flex items-center gap-1 h-5 px-1">
                  <span className="w-1 bg-red-600 rounded-full h-3 animate-waveform-1" />
                  <span className="w-1 bg-red-600 rounded-full h-5 animate-waveform-2" />
                  <span className="w-1 bg-red-600 rounded-full h-2.5 animate-waveform-3" />
                  <span className="w-1 bg-red-600 rounded-full h-4.5 animate-waveform-4" />
                  <span className="w-1 bg-red-600 rounded-full h-3 animate-waveform-2" />
                </div>
                <div>
                  <span className="font-semibold block sm:inline">
                    Listening ({language === 'hi' ? 'हिन्दी' : language === 'kn' ? 'ಕನ್ನಡ' : 'English'}):
                  </span>
                  <span className="text-[11px] text-red-600 sm:ml-1">
                    Speak into your mic — words stream live into the input box
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (inputText.trim()) handleSendMessage();
                  }}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                >
                  Done Speaking → Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
