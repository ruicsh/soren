import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTTSOptions {
  language?: string;
  onDone?: () => void;
  pitch?: number;
  rate?: number;
  voice?: string;
}

export interface UseTTSReturn {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useTTS(options?: UseTTSOptions): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    if (options?.voice) {
      voiceRef.current = options.voice;
      return;
    }

    Speech.getAvailableVoicesAsync().then((voices) => {
      if (voices.length === 0) return;

      let candidates = voices;
      const lang = languageRef.current;
      if (lang) {
        const filtered = voices.filter((v) => v.language.startsWith(lang));
        if (filtered.length > 0) {
          candidates = filtered;
        }
      }

      const qualityPriority = (q: string): number => {
        if (q === 'Premium') return 2;
        if (q === 'Enhanced') return 1;
        return 0;
      };

      const best = candidates.reduce((prev, curr) => {
        const pQ = qualityPriority(prev.quality);
        const cQ = qualityPriority(curr.quality);
        return cQ > pQ ? curr : prev;
      });
      voiceRef.current = best.identifier;
    });
  }, [options?.voice, options?.language]);

  const speak = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    pendingRef.current++;
    setIsSpeaking(true);

    Speech.speak(trimmed, {
      language: languageRef.current,
      onDone: () => {
        pendingRef.current--;
        if (pendingRef.current <= 0) {
          pendingRef.current = 0;
          setIsSpeaking(false);
          onDoneRef.current?.();
        }
      },
      onError: () => {
        pendingRef.current--;
        if (pendingRef.current <= 0) {
          pendingRef.current = 0;
          setIsSpeaking(false);
          onDoneRef.current?.();
        }
      },
      pitch: pitchRef.current,
      rate: rateRef.current,
      voice: voiceRef.current,
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    pendingRef.current = 0;
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}
