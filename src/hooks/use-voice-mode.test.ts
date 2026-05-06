import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { vi } from 'vitest';

import { emitSpeechEvent } from '@/tests/test-setup';

import { useVoiceMode } from './use-voice-mode';

vi.mock('@/lib/llm/xhr-stream', () => ({
  createStreamChat: vi.fn(() => {
    const gen = (async function* () {
      yield 'Hello';
      yield ' world.';
    })();

    return Object.assign(gen, {
      metrics: { firstTokenTime: null, headersTime: null },
    });
  }),
}));

describe('useVoiceMode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initializes in idle state', () => {
    const { result } = renderHook(() => useVoiceMode());
    expect(result.current.state).toBe('idle');
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('activate requests permissions and transitions to listening', async () => {
    const { result } = renderHook(() => useVoiceMode());

    await act(async () => {
      await result.current.activate();
    });

    expect(
      ExpoSpeechRecognitionModule.requestPermissionsAsync,
    ).toHaveBeenCalled();
    expect(result.current.state).toBe('listening');

    act(() => {
      emitSpeechEvent('result', {
        isFinal: false,
        results: [{ confidence: 0.9, segments: [], transcript: 'Hi' }],
      });
    });

    expect(result.current.transcript).toBe('Hi');
  });

  it('deactivate resets to idle', async () => {
    const { result } = renderHook(() => useVoiceMode());

    await act(async () => {
      await result.current.activate();
    });

    act(() => {
      result.current.deactivate();
    });

    expect(result.current.state).toBe('idle');
  });

  it('transitions to error on dictation failure', async () => {
    vi.mocked(
      ExpoSpeechRecognitionModule.requestPermissionsAsync,
    ).mockRejectedValue(new Error('Mic broken'));

    const { result } = renderHook(() => useVoiceMode());

    await act(async () => {
      await result.current.activate();
    });

    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.error).toBe('Mic broken');
  });
});
