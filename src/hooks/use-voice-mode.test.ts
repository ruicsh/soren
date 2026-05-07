import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { vi } from 'vitest';

import { useChatStream } from '@/hooks/use-chat-stream';
import { emitSpeechEvent } from '@/tests/test-setup';

import { useVoiceMode } from './use-voice-mode';

vi.mock('@/hooks/use-chat-stream', () => ({
  useChatStream: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  })),
}));

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

    await act(async () => {
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

    await act(async () => {
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

  it('filters out reasoning tags before sending to TTS', async () => {
    let capturedOnSentence: ((s: string) => void) | undefined;
    vi.mocked(useChatStream).mockImplementation((opts) => {
      capturedOnSentence = opts?.onStreamingChunk;

      return {
        isStreaming: false,
        messages: [],
        sendMessage: vi.fn(() => Promise.resolve()),
        stop: vi.fn(),
      };
    });

    const { result } = renderUseVoiceMode();

    await act(async () => {
      await result.current.activate();
    });

    // Simulate assistant sending a chunk with hidden reasoning
    await act(async () => {
      capturedOnSentence?.('<thought>thinking</thought>Hello');
    });

    // Wait for sentence buffer to flush (voice mode flushes on LLM done or punctuation)
    // For simplicity, we can just trigger a punctuation or wait if sentence-buffer emits immediately
    await act(async () => {
      capturedOnSentence?.('. ');
    });

    // Check if Speech.speak was called with sanitized text
    expect(Speech.speak).toHaveBeenCalledWith('Hello.', expect.anything());
    // Should NOT contain <thought>
    const calls = vi.mocked(Speech.speak).mock.calls;
    const spokenText = calls[calls.length - 1][0];
    expect(spokenText).not.toContain('<thought>');
  });

  it('interrupt() stops TTS, stream and starts listening', async () => {
    const mockStopStream = vi.fn();
    vi.mocked(useChatStream).mockReturnValue({
      isStreaming: true,
      messages: [],
      sendMessage: vi.fn(() => Promise.resolve()),
      stop: mockStopStream,
    });

    const { result } = renderUseVoiceMode();

    await act(async () => {
      await result.current.activate();
    });

    // Simulate speaking state by triggering a sentence
    let capturedOnChunk: ((c: string) => void) | undefined;
    vi.mocked(useChatStream).mockImplementation((opts) => {
      capturedOnChunk = opts?.onStreamingChunk;

      return {
        isStreaming: true,
        messages: [],
        sendMessage: vi.fn(() => Promise.resolve()),
        stop: mockStopStream,
      };
    });

    // Re-render to pick up mock implementation
    const { result: result2 } = renderUseVoiceMode();
    await act(async () => {
      await result2.current.activate();
    });

    await act(async () => {
      capturedOnChunk?.('Hello. ');
    });

    expect(result2.current.state).toBe('speaking');

    await act(async () => {
      result2.current.interrupt();
    });

    expect(Speech.stop).toHaveBeenCalled();
    expect(mockStopStream).toHaveBeenCalled();
    expect(result2.current.state).toBe('listening');
  });
});
