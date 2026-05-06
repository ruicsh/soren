import { act, renderHook } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { vi } from 'vitest';

import { useTTS } from './use-tts';

type UseTTSOptions = Parameters<typeof useTTS>[0];

const DEFAULT_OPTIONS: UseTTSOptions = {};

function renderUseTTS({
  overrides = {},
}: { overrides?: Partial<UseTTSOptions> } = {}) {
  const options = { ...DEFAULT_OPTIONS, ...overrides };

  return {
    ...renderHook(() => useTTS(options)),
    options,
  };
}

describe('useTTS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(Speech.getAvailableVoicesAsync).mockResolvedValue([]);
  });

  it('initializes with isSpeaking false', () => {
    const { result } = renderUseTTS();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('speak queues text and sets isSpeaking true', () => {
    const { result } = renderUseTTS();

    act(() => {
      result.current.speak('Hello world');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello world',
      expect.any(Object),
    );
    expect(result.current.isSpeaking).toBe(true);
  });

  it('ignores empty or whitespace text', () => {
    const { result } = renderUseTTS();

    act(() => {
      result.current.speak('   ');
    });

    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('calls onDone when speak finishes', async () => {
    const { options, result } = renderUseTTS({
      overrides: { onDone: vi.fn() },
    });

    act(() => {
      result.current.speak('Hello');
    });

    const speakOptions = vi.mocked(Speech.speak).mock.calls[0][1];
    act(() => {
      speakOptions?.onDone?.();
    });

    await act(() => new Promise((r) => setTimeout(r, 0)));

    expect(options.onDone).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('calls onDone when speak errors', async () => {
    const { options, result } = renderUseTTS({
      overrides: { onDone: vi.fn() },
    });

    act(() => {
      result.current.speak('Hello');
    });

    const speakOptions = vi.mocked(Speech.speak).mock.calls[0][1];
    act(() => {
      speakOptions?.onError?.(new Error('test'));
    });

    await act(() => new Promise((r) => setTimeout(r, 0)));

    expect(options.onDone).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('stops speech and resets isSpeaking', () => {
    const { result } = renderUseTTS();

    act(() => {
      result.current.speak('Hello');
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(Speech.stop).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('passes pitch and rate to Speech.speak', () => {
    const { result } = renderUseTTS({
      overrides: { pitch: 0.8, rate: 0.75 },
    });

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ pitch: 0.8, rate: 0.75 }),
    );
  });

  it('auto-selects best quality voice on mount when no explicit voice given', async () => {
    const voices = [
      {
        identifier: 'com.apple.ttsbubble.Moira',
        language: 'en-IE',
        name: 'Moira',
        quality: Speech.VoiceQuality.Default,
      },
      {
        identifier: 'com.apple.ttsbubble.Samantha',
        language: 'en-US',
        name: 'Samantha',
        quality: Speech.VoiceQuality.Enhanced,
      },
    ];
    vi.mocked(Speech.getAvailableVoicesAsync).mockResolvedValue(voices);

    const { result } = renderUseTTS({
      overrides: { language: 'en' },
    });

    await act(() => Promise.resolve());
    await act(() => Promise.resolve());

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'com.apple.ttsbubble.Samantha' }),
    );
  });

  it('prefers Premium over Enhanced', async () => {
    const voices = [
      {
        identifier: 'en.enhanced',
        language: 'en-US',
        name: 'Enhanced',
        quality: Speech.VoiceQuality.Enhanced,
      },
      {
        identifier: 'en.premium',
        language: 'en-US',
        name: 'Premium',
        quality: 'Premium' as any,
      },
    ];
    vi.mocked(Speech.getAvailableVoicesAsync).mockResolvedValue(voices);

    const { result } = renderUseTTS({
      overrides: { language: 'en' },
    });
    await act(() => Promise.resolve());
    await act(() => Promise.resolve());

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'en.premium' }),
    );
  });

  it('prefers exact language match among same quality', async () => {
    const voices = [
      {
        identifier: 'en-GB.enhanced',
        language: 'en-GB',
        name: 'GB',
        quality: Speech.VoiceQuality.Enhanced,
      },
      {
        identifier: 'en-US.enhanced',
        language: 'en-US',
        name: 'US',
        quality: Speech.VoiceQuality.Enhanced,
      },
    ];
    vi.mocked(Speech.getAvailableVoicesAsync).mockResolvedValue(voices);

    const { result } = renderUseTTS({
      overrides: { language: 'en-GB' },
    });
    await act(() => Promise.resolve());
    await act(() => Promise.resolve());

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'en-GB.enhanced' }),
    );
  });

  it('explicit voice overrides auto-select', () => {
    const { result } = renderUseTTS({
      overrides: { voice: 'com.apple.ttsbubble.Moira' },
    });

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'com.apple.ttsbubble.Moira' }),
    );
  });

  it('passes language when specified', () => {
    const { result } = renderUseTTS({
      overrides: { language: 'fr-FR' },
    });

    act(() => {
      result.current.speak('Bonjour');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Bonjour',
      expect.objectContaining({ language: 'fr-FR' }),
    );
  });
});
