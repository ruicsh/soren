import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

const VOICE_DEBUG = process.env.EXPO_PUBLIC_VOICE_DEBUG === '1';

export interface UseTTSOptions {
  language?: string;
  onDone?: () => void;
  pitch?: number;
  rate?: number;
  voice?: string;
}

export interface UseTTSReturn {
  availableVoices: Speech.Voice[];
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useTTS(options?: UseTTSOptions): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const pendingRef = useRef(0);
  const onDoneRef = useRef(options?.onDone);
  const voiceRef = useRef<string | undefined>(options?.voice);
  const languageRef = useRef(options?.language);
  const pitchRef = useRef(options?.pitch);
  const rateRef = useRef(options?.rate);

  useEffect(() => {
    onDoneRef.current = options?.onDone;
    languageRef.current = options?.language;
    pitchRef.current = options?.pitch;
    rateRef.current = options?.rate;
  });

  useEffect(() => {
    let mounted = true;
    Speech.getAvailableVoicesAsync().then((voices) => {
      if (!mounted) return;
      setAvailableVoices(voices);

      if (options?.voice) {
        voiceRef.current = options.voice;
        return;
      }

      if (voices.length === 0) return;

      debugLog('voices_available', {
        count: voices.length,
        voices: voices.map((v) => ({
          id: v.identifier,
          lang: v.language,
          name: v.name,
          quality: v.quality,
        })),
      });

      let candidates = voices;
      const lang = languageRef.current;
      if (lang) {
        const filtered = voices.filter((v) => v.language.startsWith(lang));
        if (filtered.length > 0) {
          candidates = filtered;
        }
      }

      const qualityPriority = (v: Speech.Voice): number => {
        const q = v.quality as string;
        if (q === 'Premium') return 2;
        if (q === 'Enhanced' || v.quality === Speech.VoiceQuality.Enhanced)
          return 1;
        // Heuristic for iOS: some premium voices report 'Default' quality but have 'premium' in ID/name
        const lowerId = v.identifier.toLowerCase();
        const lowerName = v.name.toLowerCase();
        if (lowerId.includes('.premium.') || lowerName.includes('(premium)')) {
          return 2;
        }
        if (
          lowerId.includes('.enhanced.') ||
          lowerName.includes('(enhanced)')
        ) {
          return 1;
        }
        return 0;
      };

      const ranked = [...candidates].sort((a, b) => {
        const qA = qualityPriority(a);
        const qB = qualityPriority(b);
        if (qB !== qA) return qB - qA;
        // Same quality, prefer exact language match if provided
        if (lang) {
          const matchA = a.language === lang ? 1 : 0;
          const matchB = b.language === lang ? 1 : 0;
          if (matchB !== matchA) return matchB - matchA;
        }
        return 0;
      });

      debugLog('voice_candidates_ranked', {
        top: ranked.slice(0, 3).map((v) => ({
          id: v.identifier,
          lang: v.language,
          quality: v.quality,
        })),
      });

      const best = ranked[0];
      voiceRef.current = best.identifier;
      debugLog('voice_selected', {
        id: best.identifier,
        quality: best.quality,
      });
    });
    return () => {
      mounted = false;
    };
  }, [options?.voice, options?.language]);

  const speak = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    pendingRef.current++;
    setIsSpeaking(true);
    debugLog('speak_enqueue', {
      len: trimmed.length,
      pending: pendingRef.current,
    });

    Speech.speak(trimmed, {
      language: languageRef.current,
      onDone: () => {
        pendingRef.current--;
        debugLog('speak_done', { pending: pendingRef.current });
        if (pendingRef.current <= 0) {
          pendingRef.current = 0;
          setIsSpeaking(false);
          // Use a microtask/timeout to ensure state updates have propagated
          setTimeout(() => {
            if (pendingRef.current === 0) {
              onDoneRef.current?.();
            }
          }, 0);
        }
      },
      onError: (err) => {
        pendingRef.current--;
        debugLog('speak_error', {
          err,
          pending: pendingRef.current,
        });
        if (pendingRef.current <= 0) {
          pendingRef.current = 0;
          setIsSpeaking(false);
          setTimeout(() => {
            if (pendingRef.current === 0) {
              onDoneRef.current?.();
            }
          }, 0);
        }
      },
      pitch: pitchRef.current,
      rate: rateRef.current,
      voice: voiceRef.current,
    });
  }, []);

  const stop = useCallback(() => {
    debugLog('stop_call');
    Speech.stop();
    pendingRef.current = 0;
    setIsSpeaking(false);
  }, []);

  return { availableVoices, isSpeaking, speak, stop };
}

function debugLog(event: string, meta?: any) {
  if (VOICE_DEBUG) {
    console.log(`[TTS] ${Date.now()} ${event}`, meta || '');
  }
}
