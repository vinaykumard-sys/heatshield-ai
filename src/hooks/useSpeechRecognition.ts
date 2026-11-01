import { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage } from '../types';
import { getSpeechLocale } from '../lib/assistantEngine';

interface UseSpeechRecognitionOptions {
  language: SupportedLanguage;
  onFinalTranscript?: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
}

export function useSpeechRecognition({
  language,
  onFinalTranscript,
  onInterimTranscript
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef('');

  // Callback refs to always access latest handlers without re-triggering effects
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  const onInterimTranscriptRef = useRef(onInterimTranscript);
  onInterimTranscriptRef.current = onInterimTranscript;

  const languageRef = useRef(language);
  languageRef.current = language;

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const cleanupRecognition = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Internal function to create and start a fresh SpeechRecognition instance
  const startRecognitionInstance = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    cleanupRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Locale mapping
      const locale = getSpeechLocale(languageRef.current);
      recognition.lang = locale;

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionError(null);
        setNetworkError(null);
        setIsNetworkBlocked(false);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += text + ' ';
          } else {
            interimChunk += text;
          }
        }

        if (finalChunk.trim()) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current + ' ' + finalChunk
          ).trim();
          setTranscript(accumulatedTranscriptRef.current);
          if (onFinalTranscriptRef.current) {
            onFinalTranscriptRef.current(accumulatedTranscriptRef.current);
          }
        }

        setInterimTranscript(interimChunk);

        // Combined live transcription for real-time input typing
        const liveText = (
          accumulatedTranscriptRef.current + (interimChunk ? ' ' + interimChunk : '')
        ).trim();

        if (liveText && onInterimTranscriptRef.current) {
          onInterimTranscriptRef.current(liveText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);

        // Harmless silence / no speech detected in Chrome
        if (event.error === 'no-speech') {
          return;
        }

        // Aborted cleanly by user
        if (event.error === 'aborted') {
          return;
        }

        // Microphone permission or hardware capture blocked
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          shouldListenRef.current = false;
          setIsListening(false);
          setPermissionError(
            'Microphone access blocked. Click the lock/camera icon in your browser address bar to allow microphone access.'
          );
          return;
        }

        // Network error: Chrome speech service unreachable (Brave, adblocker, firewall, or offline)
        if (event.error === 'network') {
          shouldListenRef.current = false;
          setIsListening(false);
          setIsNetworkBlocked(true);
          setNetworkError(
            'Browser speech-to-text service is unreachable. (Common in Brave browser or adblockers). Tap any suggested question or type your query below — voice answers will still speak aloud!'
          );
          return;
        }
      };

      recognition.onend = () => {
        // If user is still meant to be listening and no fatal error occurred, restart
        if (shouldListenRef.current) {
          restartTimerRef.current = window.setTimeout(() => {
            if (shouldListenRef.current) {
              startRecognitionInstance();
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start error:', err);
      shouldListenRef.current = false;
      setIsListening(false);
      if (err.name === 'NotAllowedError') {
        setPermissionError('Microphone permission blocked. Please allow microphone access in browser settings.');
      }
    }
  }, [cleanupRecognition]);

  const startListening = useCallback(() => {
    // 1. Cancel any active Text-to-Speech output so it does not interfere
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 2. Reset states
    setPermissionError(null);
    setNetworkError(null);
    setIsNetworkBlocked(false);
    accumulatedTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    shouldListenRef.current = true;
    startRecognitionInstance();
  }, [startRecognitionInstance]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    cleanupRecognition();
    setIsListening(false);
  }, [cleanupRecognition]);

  const toggleListening = useCallback(() => {
    if (isListening || shouldListenRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount or language change
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      cleanupRecognition();
    };
  }, [language, cleanupRecognition]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    permissionError,
    isNetworkBlocked,
    networkError,
    startListening,
    stopListening,
    toggleListening
  };
}
