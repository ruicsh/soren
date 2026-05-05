import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/lib/llm/types';

import { useChatStream } from '@/hooks/use-chat-stream';
import { useDictation } from '@/hooks/use-dictation';
import { useSentenceBuffer } from '@/hooks/use-sentence-buffer';
import { useTTS } from '@/hooks/use-tts';

export interface UseVoiceModeReturn {
  activate: () => Promise<void>;
  availableVoices: import('expo-speech').Voice[];
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
const VOICE_DEBUG = process.env.EXPO_PUBLIC_VOICE_DEBUG === '1';

export interface UseVoiceModeOptions {
  voiceId?: null | string;
}

export function useVoiceMode(
  options?: UseVoiceModeOptions,
): UseVoiceModeReturn {
  const [state, setState] = useState<VoiceModeState>('idle');
  const [error, setError] = useState<null | string>(null);
  const streamDoneRef = useRef(false);
  const ttsIsSpeakingRef = useRef(false);
  const turnRef = useRef(0);

  const {
    availableVoices,
    isSpeaking: ttsIsSpeaking,
    speak: ttsSpeak,
    stop: ttsStop,
  } = useTTS({
    language: 'en-GB',
    onDone: () => {
      debugLog('tts_done_callback', {
        state: stateRef.current,
        streamDone: streamDoneRef.current,
      });
      // ONLY re-arm from TTS completion, and only if we are in a speaking/processing state
      if (
        streamDoneRef.current &&
        (stateRef.current === 'speaking' || stateRef.current === 'processing')
      ) {
        setTimeout(() => {
          if (
            stateRef.current === 'speaking' ||
            stateRef.current === 'processing'
          ) {
            debugLog('re-arm_from_tts_done');
            startListeningRef.current();
          }
        }, 500); // Slightly longer delay to ensure audio session is fully clear
      }
    },
    pitch: 0.95,
    rate: 0.9,
    voice: options?.voiceId ?? undefined,
  });

  const stateRef = useRef<VoiceModeState>('idle');
  useEffect(() => {
    if (stateRef.current !== state) {
      debugLog('state_change', { from: stateRef.current, to: state });
    }
    stateRef.current = state;
  }, [state]);

  const sentenceBuffer = useSentenceBuffer({
    onSentence: (sentence) => {
      if (stateRef.current !== 'idle' && stateRef.current !== 'error') {
        debugLog('sentence_emitted', { len: sentence.length });
        setState('speaking');
        ttsSpeak(sentence);
      }
    },
  });

  const {
    messages,
    sendMessage,
    stop: stopStream,
  } = useChatStream({
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
      if (!text.trim() || stateRef.current !== 'listening') {
        debugLog('onEndOfSpeech_ignored', {
          state: stateRef.current,
          textLen: text.length,
        });
        return;
      }
      turnRef.current++;
      debugLog('onEndOfSpeech_fired', {
        textLen: text.length,
        turn: turnRef.current,
      });
      setState('processing');
      stopDictation();
      streamDoneRef.current = false;
      sendMessage(text)
        .then(() => {
          debugLog('llm_stream_done', { turn: turnRef.current });
          streamDoneRef.current = true;
          sentenceBuffer.flush();
          // DO NOT re-arm here. Wait for TTS onDone.
          // This avoids the mic picking up the end of the assistant's own speech.
        })
        .catch((err) => {
          if ((stateRef.current as string) === 'idle') {
            debugLog('llm_error_ignored_idle');
            return;
          }
          debugLog('llm_error', {
            err: err instanceof Error ? err.message : err,
          });
          setError(err instanceof Error ? err.message : 'Request failed');
          setState('error');
          streamDoneRef.current = true;
        });
    },
    silenceMs: SILENCE_MS,
  });

  const isRearmingRef = useRef(false);
  const startListening = useCallback(async () => {
    if (
      stateRef.current === 'idle' ||
      stateRef.current === 'error' ||
      isRearmingRef.current
    ) {
      debugLog('startListening_ignored', {
        isRearming: isRearmingRef.current,
        state: stateRef.current,
      });
      return;
    }

    // Half-duplex check: never start mic if assistant is still speaking
    if (ttsIsSpeakingRef.current) {
      debugLog('startListening_deferred_tts_active');
      return;
    }

    isRearmingRef.current = true;
    debugLog('startListening_attempt');
    setState('listening');
    try {
      await startDictation();
      debugLog('startDictation_success');
    } catch (err) {
      if ((stateRef.current as string) !== 'idle') {
        debugLog('startDictation_fail', {
          err: err instanceof Error ? err.message : err,
        });
        setError(err instanceof Error ? err.message : 'Failed to listen');
        setState('error');
      }
    } finally {
      isRearmingRef.current = false;
    }
  }, [startDictation]);

  const startListeningRef = useRef(startListening);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const activate = useCallback(async () => {
    if (stateRef.current !== 'idle') return;
    debugLog('activate_call');
    setError(null);
    setState('connecting');
    turnRef.current = 0;
    try {
      await startDictation();
      debugLog('activate_success');
    } catch (err) {
      debugLog('activate_fail', {
        err: err instanceof Error ? err.message : err,
      });
      setError(
        err instanceof Error ? err.message : 'Failed to start voice mode',
      );
      setState('error');
    }
  }, [startDictation]);

  const deactivate = useCallback(() => {
    if (stateRef.current === 'idle') return;
    debugLog('deactivate_call');
    setState('idle');
    stopDictation();
    ttsStop();
    stopStream();
    streamDoneRef.current = false;
    isRearmingRef.current = false;
  }, [stopDictation, ttsStop, stopStream]);

  // Keep ref in sync with TTS speaking state to avoid stale closures
  useEffect(() => {
    ttsIsSpeakingRef.current = ttsIsSpeaking;
    // If TTS just finished and stream was already done, we might have missed the onDone re-arm
    if (
      !ttsIsSpeaking &&
      streamDoneRef.current &&
      stateRef.current === 'speaking'
    ) {
      debugLog('speaking_effect_sync_rearm');
      startListeningRef.current();
    }
  }, [ttsIsSpeaking]);

  // connecting → listening when recording starts
  useEffect(() => {
    if (state === 'connecting' && isRecording) {
      debugLog('connected_listening');
      setState('listening');
    }
  }, [state, isRecording]);

  // Error handling
  useEffect(() => {
    if (dictationError && state !== 'idle') {
      debugLog('dictation_error_effect', { err: dictationError });
      setError(dictationError);
      setState('error');
    }
  }, [dictationError, state]);

  // speak → listening effect removed. Logic moved to ttsIsSpeaking sync effect and onDone.

  // Auto-disconnect after LISTEN_TIMEOUT_MS of listening with no transcript
  useEffect(() => {
    if (state !== 'listening') return;
    const timer = setTimeout(() => {
      if (!transcript.trim() && stateRef.current === 'listening') {
        debugLog('listen_timeout_disconnect');
        deactivate();
      }
    }, LISTEN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [state, transcript, deactivate]);

  // Watchdog: state is listening but isRecording is false for too long
  useEffect(() => {
    if (state !== 'listening') return;
    const timer = setTimeout(() => {
      if (stateRef.current === 'listening' && !isRecording) {
        debugLog('watchdog_rearm', { isRecording });
        startListeningRef.current();
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [state, isRecording]);

  return {
    activate,
    availableVoices,
    deactivate,
    error,
    messages,
    state,
    transcript,
  };
}

function debugLog(event: string, meta?: any) {
  if (VOICE_DEBUG) {
    console.log(`[VOICE] ${Date.now()} ${event}`, meta || '');
  }
}
