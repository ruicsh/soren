import { act, renderHook } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { vi } from 'vitest';

import { useTTS } from './use-tts';

type UseTTSOptions = Parameters<typeof useTTS>[0];

const DEFAULT_OPTIONS: UseTTSOptions = {};

let getAvailableVoicesDeferred: {
  reject: (error: any) => void;
  resolve: (value: any[]) => void;
};

const renderUseTTS = async (
  overrides?: Partial<UseTTSOptions>,
  voices: any[] = [],
) => {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  const renderResult = renderHook(() => useTTS(options));

  await act(async () => {
    getAvailableVoicesDeferred.resolve(voices);
  });

  return { ...renderResult, options };
};

describe('useTTS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(Speech.getAvailableVoicesAsync).mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          getAvailableVoicesDeferred = { reject, resolve };
        }),
    );
  });

  it('initializes with isSpeaking false', async () => {
    const { result } = await renderUseTTS();

    expect(result.current.isSpeaking).toBe(false);
  });

  it('speak queues text and sets isSpeaking true', async () => {
    const { result } = await renderUseTTS();

    act(() => {
      result.current.speak('Hello world');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello world',
      expect.any(Object),
    );
    expect(result.current.isSpeaking).toBe(true);
  });

  it('ignores empty or whitespace text', async () => {
    const { result } = await renderUseTTS();

    act(() => {
      result.current.speak('   ');
    });

    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('calls onDone when speak finishes', async () => {
    const onDone = vi.fn();
    const { result } = await renderUseTTS({ onDone });

    act(() => {
      result.current.speak('Hello');
    });

    const speakOptions = vi.mocked(Speech.speak).mock.calls[0][1];
    await act(async () => {
      speakOptions?.onDone?.();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onDone).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('calls onDone when speak errors', async () => {
    const onDone = vi.fn();
    const { result } = await renderUseTTS({ onDone });

    act(() => {
      result.current.speak('Hello');
    });

    const speakOptions = vi.mocked(Speech.speak).mock.calls[0][1];
    await act(async () => {
      speakOptions?.onError?.(new Error('test'));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onDone).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('stops speech and resets isSpeaking', async () => {
    const { result } = await renderUseTTS();

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

  it('passes pitch and rate to Speech.speak', async () => {
    const { result } = await renderUseTTS({ pitch: 0.8, rate: 0.75 });

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
    const { result } = await renderUseTTS({ language: 'en' }, voices);

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
    const { result } = await renderUseTTS({ language: 'en' }, voices);

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
    const { result } = await renderUseTTS({ language: 'en-GB' }, voices);

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'en-GB.enhanced' }),
    );
  });

  it('explicit voice overrides auto-select', async () => {
    const { result } = await renderUseTTS({
      voice: 'com.apple.ttsbubble.Moira',
    });

    act(() => {
      result.current.speak('Hello');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ voice: 'com.apple.ttsbubble.Moira' }),
    );
  });

  it('passes language when specified', async () => {
    const { result } = await renderUseTTS({ language: 'fr-FR' });

    act(() => {
      result.current.speak('Bonjour');
    });

    expect(Speech.speak).toHaveBeenCalledWith(
      'Bonjour',
      expect.objectContaining({ language: 'fr-FR' }),
    );
  });

  it('excludes non-English voices from availableVoices', async () => {
    const voices = [
      {
        identifier: 'en.samantha',
        language: 'en-US',
        name: 'Samantha',
        quality: Speech.VoiceQuality.Enhanced,
      },
      {
        identifier: 'es.maria',
        language: 'es-MX',
        name: 'Maria',
        quality: Speech.VoiceQuality.Default,
      },
    ];
    const { result } = await renderUseTTS({}, voices);

    expect(result.current.availableVoices).toHaveLength(1);
    expect(result.current.availableVoices[0].identifier).toBe('en.samantha');
    expect(
      result.current.availableVoices.find((v) => v.identifier === 'es.maria'),
    ).toBeUndefined();
  });
});
