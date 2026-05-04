import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';

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

export function useDictation(): UseDictationReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<null | string>(null);
  const finalRef = useRef('');
  const interimRef = useRef('');

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    if (!result) return;

    if (event.isFinal) {
      finalRef.current = (finalRef.current + ' ' + result.transcript).trim();
      interimRef.current = '';
      setTranscript(finalRef.current);
    } else {
      interimRef.current = result.transcript;
      setTranscript((finalRef.current + ' ' + result.transcript).trim());
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message);
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
    interimRef.current = '';
    setTranscript(finalRef.current);
  });

  const startDictation = useCallback(async () => {
    setError(null);
    finalRef.current = '';
    interimRef.current = '';
    setTranscript('');

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
