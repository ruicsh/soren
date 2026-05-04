import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export interface UseDictationReturn {
  /** Whether speech recognition is currently active */
  isRecording: boolean;
  /** The current transcript (final + interim) */
  transcript: string;
  /** Start dictation (requests permissions if needed) */
  startDictation: () => Promise<void>;
  /** Stop dictation and finalize the transcript */
  stopDictation: () => void;
  /** Error message if something went wrong */
  error: string | null;
}

export function useDictation(): UseDictationReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
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
        lang: 'en-US',
        continuous: true,
        interimResults: true,
        addsPunctuation: true,
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

  return { isRecording, transcript, startDictation, stopDictation, error };
}
