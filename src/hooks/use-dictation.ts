import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

const VOICE_DEBUG = process.env.EXPO_PUBLIC_DEBUG_VOICE === '1';

export interface UseDictationOptions {
  /** Callback fired after silenceMs of no transcript change while recording */
  onEndOfSpeech?: (transcript: string) => void;
  /** Milliseconds of silence to wait before firing onEndOfSpeech */
  silenceMs?: number;
}

export interface UseDictationReturn {
  /** Error message if something went wrong */
  error: null | string;
  /** Whether speech recognition is currently active */
  isRecording: boolean;
  /** Start dictation (requests permissions if needed) */
  startDictation: () => Promise<void>;
  /** Stop dictation and finalize the transcript */
  stopDictation: () => void;
  /** The current transcript (final + interim) */
  transcript: string;
}

export function useDictation(
  options?: UseDictationOptions,
): UseDictationReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<null | string>(null);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const silenceTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const isRecordingRef = useRef(false);
  const onEndOfSpeechFiredRef = useRef(false);
  const recordingSessionIdRef = useRef(0);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
    debugLog('isRecording_change', { isRecording });
  }, [isRecording]);

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    if (!result) return;

    let nextTranscript: string;

    if (event.isFinal) {
      finalRef.current = (finalRef.current + ' ' + result.transcript).trim();
      interimRef.current = '';
      nextTranscript = finalRef.current;
      debugLog('result_final', {
        len: result.transcript.length,
        totalLen: nextTranscript.length,
      });
    } else {
      interimRef.current = result.transcript;
      nextTranscript = (finalRef.current + ' ' + result.transcript).trim();
      debugLog('result_interim', {
        len: result.transcript.length,
        totalLen: nextTranscript.length,
      });
    }

    setTranscript(nextTranscript);

    if (options?.silenceMs && options?.onEndOfSpeech) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current && nextTranscript.trim()) {
          debugLog('silence_timer_fire', {
            sessionId: recordingSessionIdRef.current,
          });
          onEndOfSpeechFiredRef.current = true;
          options.onEndOfSpeech!(nextTranscript);
        }
      }, options.silenceMs);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    // If we are intentionally stopping, suppress the error
    if (isStoppingRef.current) {
      debugLog('error_event_suppressed_during_stop', {
        code: event.error,
        msg: event.message,
      });

      return;
    }

    debugLog('error_event', {
      code: event.error,
      msg: event.message,
      sessionId: recordingSessionIdRef.current,
    });
    setError(event.message);
    setIsRecording(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  });

  useSpeechRecognitionEvent('end', () => {
    debugLog('end_event', {
      isStopping: isStoppingRef.current,
      sessionId: recordingSessionIdRef.current,
    });
    isStoppingRef.current = false;
    setIsRecording(false);
    interimRef.current = '';
    const finalTranscript = finalRef.current;
    setTranscript(finalTranscript);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    // Fire onEndOfSpeech with final transcript if there's pending text
    // that wasn't captured by the silence timer (e.g. natural end or manual stop)
    if (
      !onEndOfSpeechFiredRef.current &&
      finalTranscript.trim() &&
      options?.onEndOfSpeech
    ) {
      debugLog('end_event_fallback_fire', {
        sessionId: recordingSessionIdRef.current,
      });
      options.onEndOfSpeech(finalTranscript);
    }
  });

  const startDictation = useCallback(async () => {
    recordingSessionIdRef.current++;
    debugLog('startDictation_call', {
      sessionId: recordingSessionIdRef.current,
    });
    isStoppingRef.current = false;
    setError(null);
    finalRef.current = '';
    interimRef.current = '';
    setTranscript('');
    onEndOfSpeechFiredRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      debugLog('permission_result', { granted: perms.granted });
      if (!perms.granted) {
        setError('Microphone permission denied');
        throw new Error('Microphone permission denied');
      }

      setIsRecording(true);
      debugLog('module_start_call');
      ExpoSpeechRecognitionModule.start({
        addsPunctuation: true,
        continuous: true,
        interimResults: true,
        lang: 'en-US',
      });
    } catch (err) {
      debugLog('module_start_fail', {
        err: err instanceof Error ? err.message : err,
      });
      const msg =
        err instanceof Error ? err.message : 'Failed to start dictation';
      setError(msg);
      throw err;
    }
  }, []);

  const stopDictation = useCallback(() => {
    debugLog('stopDictation_call', {
      sessionId: recordingSessionIdRef.current,
    });
    isStoppingRef.current = true;
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { error, isRecording, startDictation, stopDictation, transcript };
}

function debugLog(event: string, meta?: any) {
  if (VOICE_DEBUG) {
    console.log(`[DICT] ${Date.now()} ${event}`, meta || '');
  }
}
