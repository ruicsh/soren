import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { vi } from 'vitest';

import { emitSpeechEvent } from '@/tests/test-setup';

import { useVoiceMode } from './use-voice-mode';

type UseVoiceModeOptions = Parameters<typeof useVoiceMode>[0];

const DEFAULT_OPTIONS: UseVoiceModeOptions = {
  chatbotUuid: 'test-uuid',
};

function renderUseVoiceMode({
  overrides = {},
}: { overrides?: Partial<UseVoiceModeOptions> } = {}) {
  const options = { ...DEFAULT_OPTIONS, ...overrides };

  return {
    ...renderHook(() => useVoiceMode(options)),
    options,
  };
}

describe('useVoiceMode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('initializes in idle state', async () => {
    const { result } = renderUseVoiceMode();
    await waitFor(() => expect(result.current.state).toBe('idle'));
    expect(result.current.state).toBe('idle');
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('activate requests permissions and transitions to listening', async () => {
    const { result } = renderUseVoiceMode();

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
    const { result } = renderUseVoiceMode();

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

    const { result } = renderUseVoiceMode();

    await act(async () => {
      await result.current.activate();
    });

    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.error).toBe('Mic broken');
  });
});
