import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { vi } from 'vitest';

import type { StreamMetrics } from '@/lib/llm/types';

import { createProvider } from '@/lib/llm/catalog';
import { createStreamChat } from '@/lib/llm/xhr-stream';

import { useChatStream } from './use-chat-stream';

vi.mock('@/lib/llm/xhr-stream', () => ({
  createStreamChat: vi.fn(),
}));

vi.mock('@/lib/llm/catalog', () => ({
  createProvider: vi.fn(() => ({
    buildRequest: vi.fn(() => ({ body: '', headers: {}, url: '' })),
    isDone: vi.fn(() => false),
    parseChunk: vi.fn(() => []),
    warmup: vi.fn(),
  })),
}));

vi.mock('@/lib/llm/openai-compat', () => ({
  openaiCompatProvider: vi.fn(() => ({
    buildRequest: vi.fn(() => ({ body: '', headers: {}, url: '' })),
    isDone: vi.fn(() => false),
    parseChunk: vi.fn(() => []),
    warmup: vi.fn(),
  })),
}));

function withMetrics(
  gen: AsyncGenerator<string>,
): AsyncGenerator<string> & { metrics: StreamMetrics } {
  return Object.assign(gen, {
    metrics: { firstTokenTime: null, headersTime: null },
  });
}

describe('useChatStream', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes with empty messages and isStreaming false', () => {
    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('sendMessage appends user and assistant messages', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          // empty stream
        })(),
      ),
    );

    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      content: 'Hello',
      role: 'user',
    });
    expect(result.current.messages[1]).toMatchObject({
      content: '',
      role: 'assistant',
    });
  });

  it('isStreaming becomes true when a stream starts', () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          await new Promise(() => {}); // never completes
        })(),
      ),
    );

    const { result, unmount } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    act(() => {
      result.current.sendMessage('Hi');
    });

    expect(result.current.isStreaming).toBe(true);
    unmount();
  });

  it('isStreaming becomes false after stream completes', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          yield 'done';
        })(),
      ),
    );

    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('accumulates stream deltas into the assistant message', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          yield 'Hello';
          yield ' world';
        })(),
      ),
    );

    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toBe('Hello world');
  });

  it('handles stream errors by appending error text', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          throw new Error('Network fail');
        })(),
      ),
    );

    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toBe('Network fail');
    expect(result.current.isStreaming).toBe(false);
  });

  it('ignores sendMessage when already streaming', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          yield 'start';
          await new Promise(() => {}); // never completes
        })(),
      ),
    );

    const { result, unmount } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    act(() => {
      result.current.sendMessage('First');
    });

    expect(result.current.messages).toHaveLength(2);

    await act(async () => {
      await result.current.sendMessage('Second');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('First');
    unmount();
  });

  it('ignores empty or whitespace-only messages', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          yield 'never';
        })(),
      ),
    );

    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('stop() aborts an in-flight stream', async () => {
    vi.mocked(createStreamChat).mockImplementation((_p, _h, shouldAbort) =>
      withMetrics(
        (async function* () {
          yield 'first';
          await new Promise((r) => setTimeout(r, 50));
          if (shouldAbort?.()) return;
          yield 'second';
        })(),
      ),
    );

    const { result } = renderHook(() =>
      useChatStream({ providerId: 'groq', providerModel: 'llama-3.1-8b' }),
    );

    act(() => {
      result.current.sendMessage('Hi');
    });

    await waitFor(
      () => {
        const assistant =
          result.current.messages[result.current.messages.length - 1];
        return assistant.content === 'first';
      },
      { timeout: 2000 },
    );

    act(() => {
      result.current.stop();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false), {
      timeout: 3000,
    });

    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toBe('first');
  });

  it('returns error if provider not configured', async () => {
    vi.mocked(createProvider).mockReturnValue(null);
    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toBe('LLM Provider not configured.');
  });
});
