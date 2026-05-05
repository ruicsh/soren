import { act, renderHook } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { vi } from 'vitest';

import { useTTS } from './use-tts';

describe('useTTS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(Speech.getAvailableVoicesAsync).mockResolvedValue([]);
  });

  it('initializes with isSpeaking false', () => {
    const { result } = renderHook(() => useTTS());
    expect(result.current.isSpeaking).toBe(false);
  });

  it('speak queues text and sets isSpeaking true', () => {
    const { result } = renderHook(() => useTTS());

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
    const { result } = renderHook(() => useTTS());

    act(() => {
      result.current.speak('   ');
    });

    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('calls onDone when speak finishes', async () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useTTS({ onDone }));

    act(() => {
      result.current.speak('Hello');
    });

    const options = vi.mocked(Speech.speak).mock.calls[0][1];
    act(() => {
      options?.onDone?.();
    });

    await act(() => new Promise((r) => setTimeout(r, 0)));

    expect(onDone).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('calls onDone when speak errors', async () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useTTS({ onDone }));

    act(() => {
      result.current.speak('Hello');
    });

    const options = vi.mocked(Speech.speak).mock.calls[0][1];
    act(() => {
      options?.onError?.(new Error('test'));
    });

    await act(() => new Promise((r) => setTimeout(r, 0)));

    expect(onDone).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('stops speech and resets isSpeaking', () => {
    const { result } = renderHook(() => useTTS());

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
    const { result } = renderHook(() => useTTS({ pitch: 0.8, rate: 0.75 }));

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

    const { result } = renderHook(() => useTTS({ language: 'en' }));

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

    const { result } = renderHook(() => useTTS({ language: 'en' }));
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

    const { result } = renderHook(() => useTTS({ language: 'en-GB' }));
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
    const { result } = renderHook(() =>
      useTTS({ voice: 'com.apple.ttsbubble.Moira' }),
    );

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'com.apple.ttsbubble.Moira' }),
    );
  });

  it('passes language when specified', () => {
    const { result } = renderHook(() => useTTS({ language: 'fr-FR' }));

    act(() => {
      result.current.speak('Bonjour');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Bonjour',
      expect.objectContaining({ language: 'fr-FR' }),
    );
  });
});
