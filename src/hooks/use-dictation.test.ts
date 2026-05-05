import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { vi } from 'vitest';

import { emitSpeechEvent } from '@/tests/test-setup';

import { useDictation } from './use-dictation';

describe('useDictation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initializes with isRecording false and empty transcript', () => {
    const { result } = renderHook(() => useDictation());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('requests permissions and starts recording', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    expect(
      ExpoSpeechRecognitionModule.requestPermissionsAsync,
    ).toHaveBeenCalled();
    expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith(
      expect.objectContaining({
        addsPunctuation: true,
        continuous: true,
        interimResults: true,
        lang: 'en-US',
      }),
    );
    expect(result.current.isRecording).toBe(true);
  });

  it('does not start if permissions are denied', async () => {
    vi.mocked(
      ExpoSpeechRecognitionModule.requestPermissionsAsync,
    ).mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: false,
      status: 'denied',
    } as any);

    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await expect(result.current.startDictation()).rejects.toThrow(
        'Microphone permission denied',
      );
    });

    expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Microphone permission denied');
  });

  it('handles module errors gracefully', async () => {
    vi.mocked(
      ExpoSpeechRecognitionModule.requestPermissionsAsync,
    ).mockRejectedValue(new Error('Native module not available'));

    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await expect(result.current.startDictation()).rejects.toThrow(
        'Native module not available',
      );
    });

    expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Native module not available');
  });

  it('accumulates interim results into transcript', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    act(() => {
      emitSpeechEvent('result', {
        isFinal: false,
        results: [{ confidence: 0.9, segments: [], transcript: 'Hello' }],
      });
    });

    expect(result.current.transcript).toBe('Hello');

    act(() => {
      emitSpeechEvent('result', {
        isFinal: false,
        results: [{ confidence: 0.9, segments: [], transcript: 'Hello world' }],
      });
    });

    expect(result.current.transcript).toBe('Hello world');
  });

  it('accumulates final results and clears interim buffer', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    act(() => {
      emitSpeechEvent('result', {
        isFinal: true,
        results: [{ confidence: 0.9, segments: [], transcript: 'Hello' }],
      });
    });

    expect(result.current.transcript).toBe('Hello');

    act(() => {
      emitSpeechEvent('result', {
        isFinal: false,
        results: [{ confidence: 0.9, segments: [], transcript: 'world' }],
      });
    });

    expect(result.current.transcript).toBe('Hello world');

    act(() => {
      emitSpeechEvent('result', {
        isFinal: true,
        results: [{ confidence: 0.9, segments: [], transcript: 'world' }],
      });
    });

    expect(result.current.transcript).toBe('Hello world');
  });

  it('stops recording and calls module stop', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    act(() => {
      result.current.stopDictation();
    });

    expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalled();
  });

  it('sets isRecording to false on end event', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    act(() => {
      emitSpeechEvent('end', null);
    });

    await waitFor(() => expect(result.current.isRecording).toBe(false));
  });

  it('sets error and stops recording on error event', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    act(() => {
      emitSpeechEvent('error', {
        error: 'network',
        message: 'Network error',
      });
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  it('clears previous transcript and error on new start', async () => {
    const { result } = renderHook(() => useDictation());

    await act(async () => {
      await result.current.startDictation();
    });

    act(() => {
      emitSpeechEvent('result', {
        isFinal: true,
        results: [{ confidence: 0.9, segments: [], transcript: 'Old' }],
      });
    });

    await act(async () => {
      await result.current.startDictation();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });
});
