import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { vi } from 'vitest';

import type { StreamMetrics } from '@/lib/llm/types';

import { getApiKey } from '@/lib/byok-keys';
import { createProvider } from '@/lib/llm/catalog';
import { createStreamChat } from '@/lib/llm/xhr-stream';

import { useChatStream, type UseChatStreamOptions } from './use-chat-stream';

vi.mock('@/lib/byok-keys', () => ({
  getApiKey: vi.fn(() => Promise.resolve('mock-key')),
}));

const mockProvider = {
  buildRequest: vi.fn(() => ({ body: '', headers: {}, url: '' })),
  isDone: vi.fn(() => false),
  parseChunk: vi.fn(() => []),
  warmup: vi.fn(),
};

vi.mock('@/lib/llm/catalog', () => ({
  createProvider: vi.fn(() => mockProvider),
}));

vi.mock('@/lib/llm/openai-compat', () => ({
  openaiCompatProvider: vi.fn(() => mockProvider),
}));

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

const DEFAULT_OPTIONS: UseChatStreamOptions = {
  chatbotUuid: 'uuid-123',
  providerId: 'groq',
  providerModel: 'llama-3.1-8b',
};

function renderUseChatStream({
  overrides = {},
}: { overrides?: Partial<UseChatStreamOptions> } = {}) {
  return renderHook(() => useChatStream({ ...DEFAULT_OPTIONS, ...overrides }));
}

describe('useChatStream', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes with empty messages and isStreaming false', async () => {
    const { result } = renderUseChatStream();

    // Wait for the effect that sets the provider (even if it sets it to null or a mock)
    // to complete to avoid "not wrapped in act" warning.
    await waitFor(() => expect(result.current.messages).toEqual([]));

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

    const { result } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

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

  it('isStreaming becomes true when a stream starts', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          await new Promise(() => {}); // never completes
        })(),
      ),
    );

    const { result, unmount } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

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

    const { result } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

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

    const { result } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toBe('Hello world');
  });

  it('filters out reasoning tags from onStreamingChunk callback', async () => {
    const chunks: string[] = [];
    const onStreamingChunk = vi.fn((c) => chunks.push(c));

    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          yield '<tho';
          yield 'ught>secret</thought>';
          yield 'Hello';
          yield ' <think>more</think>';
          yield 'world';
        })(),
      ),
    );

    const { result } = renderUseChatStream({
      overrides: { onStreamingChunk },
    });

    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    // onStreamingChunk should only have received the visible parts
    expect(chunks.join('')).toBe('Hello world');
    expect(
      result.current.messages[result.current.messages.length - 1].content,
    ).toBe('Hello world');
  });

  it('handles stream errors by appending error text', async () => {
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          throw new Error('Network fail');
        })(),
      ),
    );

    const { result } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

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

    const { result, unmount } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

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

    const { result } = renderUseChatStream();

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

    const { result } = renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

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
    vi.mocked(getApiKey).mockResolvedValue(null);
    const { result } = renderUseChatStream();

    // Wait for provider/history effect
    await waitFor(() => expect(getApiKey).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage('Hi');
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));

    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toBe(
      'API Key missing. Please go to Settings to add it.',
    );
  });
});
