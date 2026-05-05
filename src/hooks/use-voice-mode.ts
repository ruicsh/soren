import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/lib/llm/types';

import { useChatStream } from '@/hooks/use-chat-stream';
import { useDictation } from '@/hooks/use-dictation';
import { useSentenceBuffer } from '@/hooks/use-sentence-buffer';
import { useTTS } from '@/hooks/use-tts';

export interface UseVoiceModeReturn {
  activate: () => Promise<void>;
  deactivate: () => void;
  error: null | string;
  messages: ChatMessage[];
  state: VoiceModeState;
  transcript: string;
}

export type VoiceModeState =
  | 'connecting'
  | 'error'
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking';

const SILENCE_MS = 1500;
const LISTEN_TIMEOUT_MS = 10000;

export function useVoiceMode(): UseVoiceModeReturn {
  const [state, setState] = useState<VoiceModeState>('idle');
  const [error, setError] = useState<null | string>(null);
  const streamDoneRef = useRef(false);
  const ttsIsSpeakingRef = useRef(false);

  const {
    isSpeaking: ttsIsSpeaking,
    speak: ttsSpeak,
    stop: ttsStop,
  } = useTTS({
    language: 'en-GB',
    onDone: () => {
      if (streamDoneRef.current) {
        startListeningRef.current();
      }
    },
    pitch: 0.9,
    rate: 0.85,
  });

  const sentenceBuffer = useSentenceBuffer({
    onSentence: (sentence) => {
      setState('speaking');
      ttsSpeak(sentence);
    },
  });

  const { messages, sendMessage } = useChatStream({
    onStreamingChunk: (chunk) => {
      sentenceBuffer.append(chunk);
    },
  });

  const {
    error: dictationError,
    isRecording,
    startDictation,
    stopDictation,
    transcript,
  } = useDictation({
    onEndOfSpeech: (text) => {
      if (!text.trim()) return;
      setState('processing');
      stopDictation();
      streamDoneRef.current = false;
      sendMessage(text)
        .then(() => {
          streamDoneRef.current = true;
          sentenceBuffer.flush();
          if (!ttsIsSpeakingRef.current) {
            startListeningRef.current();
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Request failed');
          setState('error');
          streamDoneRef.current = true;
        });
    },
    silenceMs: SILENCE_MS,
  });

  const startListening = useCallback(() => {
    if (state === 'idle') return;
    setState('listening');
    startDictation();
  }, [startDictation, state]);

  const startListeningRef = useRef(startListening);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const activate = useCallback(async () => {
    setError(null);
    setState('connecting');
    try {
      await startDictation();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start voice mode',
      );
      setState('error');
    }
  }, [startDictation]);

  const deactivate = useCallback(() => {
    stopDictation();
    ttsStop();
    setState('idle');
    streamDoneRef.current = false;
  }, [stopDictation, ttsStop]);

  // Keep ref in sync with TTS speaking state to avoid stale closures
  useEffect(() => {
    ttsIsSpeakingRef.current = ttsIsSpeaking;
  }, [ttsIsSpeaking]);

  // connecting → listening when recording starts
  useEffect(() => {
    if (state === 'connecting' && isRecording) {
      setState('listening');
    }
  }, [state, isRecording]);

  // connecting → error when dictation errors
  useEffect(() => {
    if (state === 'connecting' && dictationError) {
      setError(dictationError);
      setState('error');
    }
  }, [state, dictationError]);

  // speaking → listening when TTS finishes after stream ends
  useEffect(() => {
    if (state !== 'speaking') return;
    if (!ttsIsSpeaking && streamDoneRef.current) {
      startListeningRef.current();
    }
  }, [ttsIsSpeaking, state]);

  // Auto-disconnect after LISTEN_TIMEOUT_MS of listening with no transcript
  useEffect(() => {
    if (state !== 'listening') return;
    const timer = setTimeout(() => {
      if (!transcript.trim()) {
        deactivate();
      }
    }, LISTEN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [state, transcript, deactivate]);

  return {
    activate,
    deactivate,
    error,
    messages,
    state,
    transcript,
  };
}
