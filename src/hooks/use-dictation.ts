import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    if (!result) return;

    let nextTranscript: string;

    if (event.isFinal) {
      finalRef.current = (finalRef.current + ' ' + result.transcript).trim();
      interimRef.current = '';
      nextTranscript = finalRef.current;
    } else {
      interimRef.current = result.transcript;
      nextTranscript = (finalRef.current + ' ' + result.transcript).trim();
    }

    setTranscript(nextTranscript);

    if (options?.silenceMs && options?.onEndOfSpeech) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current && nextTranscript.trim()) {
          onEndOfSpeechFiredRef.current = true;
          options.onEndOfSpeech!(nextTranscript);
        }
      }, options.silenceMs);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message);
    setIsRecording(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  });

  useSpeechRecognitionEvent('end', () => {
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
      options.onEndOfSpeech(finalTranscript);
    }
  });

  const startDictation = useCallback(async () => {
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
      if (!perms.granted) {
        setError('Microphone permission denied');
        return;
      }

      setIsRecording(true);
      ExpoSpeechRecognitionModule.start({
        addsPunctuation: true,
        continuous: true,
        interimResults: true,
        lang: 'en-US',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start dictation',
      );
    }
  }, []);

  const stopDictation = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { error, isRecording, startDictation, stopDictation, transcript };
}
