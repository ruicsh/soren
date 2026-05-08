import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';

import type { StreamMetrics } from '@/lib/llm/types';

import { ExecutorchContext } from '@/context/ExecutorchContext';
import { useMemoryStore } from '@/hooks/use-memory-store';
import { getApiKey } from '@/lib/byok-keys';
import { createProvider } from '@/lib/llm/catalog';
import { createStreamChat } from '@/lib/llm/xhr-stream';

import { useChatStream, type UseChatStreamOptions } from './use-chat-stream';

let getApiKeyDeferred: {
  reject: (error: any) => void;
  resolve: (value: null | string) => void;
};
let loadMessagesDeferred: {
  reject: (error: any) => void;
  resolve: (value: any[]) => void;
};

vi.mock('@/lib/byok-keys', () => ({
  getApiKey: vi.fn(
    () =>
      new Promise((resolve, reject) => {
        getApiKeyDeferred = { reject, resolve };
      }),
  ),
}));

vi.mock('@/lib/chatbot-config', () => ({
  DEFAULT_SYSTEM_PROMPT: '',
  loadLatestAvailableChatMessages: vi.fn(
    () =>
      new Promise((resolve, reject) => {
        loadMessagesDeferred = { reject, resolve };
      }),
  ),
  resolveMemoryText: vi.fn(async () => []),
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

vi.mock('@/lib/llm/xhr-stream', () => ({
  createStreamChat: vi.fn(),
}));

vi.mock('@/hooks/use-memory-store', () => ({
  useMemoryStore: vi.fn(() => ({
    clear: vi.fn(async () => {}),
    insertInteraction: vi.fn(),
    isReady: true,
    search: vi.fn(async () => []),
    status: 'ready',
  })),
}));

const mockExecutorchContext = {
  downloadProgress: 0,
  embed: vi.fn(async () => new Float32Array(384)),
  error: null,
  status: 'ready' as const,
};

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

async function renderUseChatStream({
  overrides = {},
}: { overrides?: Partial<UseChatStreamOptions> } = {}) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ExecutorchContext.Provider value={mockExecutorchContext}>
      {children}
    </ExecutorchContext.Provider>
  );

  const renderResult = await renderHook(
    () => useChatStream({ ...DEFAULT_OPTIONS, ...overrides }),
    { wrapper },
  );

  // Resolve async effects within act() to prevent act warnings
  await act(async () => {
    getApiKeyDeferred?.resolve('mock-key');
    loadMessagesDeferred?.resolve([]);
  });

  return renderResult;
}

describe('useChatStream', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes with empty messages and isStreaming false', async () => {
    const { result } = await renderUseChatStream();

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

    const { result } = await renderUseChatStream();

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

    const { result, unmount } = await renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
      result.current.sendMessage('Hi');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));
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

    const { result } = await renderUseChatStream();

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

    const { result } = await renderUseChatStream();

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

    const { result } = await renderUseChatStream({
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

    const { result } = await renderUseChatStream();

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

    const { result, unmount } = await renderUseChatStream();

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

    const { result } = await renderUseChatStream();

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

    const { result } = await renderUseChatStream();

    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
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
    // Override the mock before rendering
    vi.mocked(getApiKey).mockResolvedValue(null);

    const renderResult = await renderHook(
      () => useChatStream({ ...DEFAULT_OPTIONS }),
      {
        wrapper: ({ children }) => (
          <ExecutorchContext.Provider value={mockExecutorchContext}>
            {children}
          </ExecutorchContext.Provider>
        ),
      },
    );

    // Resolve messages but not API key (let it fail)
    await act(async () => {
      loadMessagesDeferred?.resolve([]);
    });

    await waitFor(() => expect(getApiKey).toHaveBeenCalled());

    await act(async () => {
      await renderResult.result.current.sendMessage('Hi');
    });

    await waitFor(() =>
      expect(renderResult.result.current.messages).toHaveLength(2),
    );

    const assistant =
      renderResult.result.current.messages[
        renderResult.result.current.messages.length - 1
      ];
    expect(assistant.content).toBe(
      'API Key missing. Please go to Settings to add it.',
    );
  });

  it('uses custom systemPrompt when provided in options', async () => {
    const customPrompt = 'You are a pirate.';
    vi.mocked(createStreamChat).mockImplementation(() =>
      withMetrics(
        (async function* () {
          yield 'Ahoy';
        })(),
      ),
    );

    const { result } = await renderUseChatStream({
      overrides: { systemPrompt: customPrompt },
    });

    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(createStreamChat).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({
          content: expect.stringContaining(customPrompt),
          role: 'system',
        }),
      ]),
      expect.anything(),
    );
  });

  describe('memory embedding', () => {
    it('embeds combined user+assistant text for memory insertion', async () => {
      vi.mocked(createStreamChat).mockImplementation(() =>
        withMetrics(
          (async function* () {
            yield 'Rich assistant answer with ';
            yield 'detailed information';
          })(),
        ),
      );

      const { result } = await renderUseChatStream();
      await waitFor(() => expect(createProvider).toHaveBeenCalled());

      await act(async () => {
        await result.current.sendMessage('Short question');
      });

      expect(mockExecutorchContext.embed).toHaveBeenCalledTimes(2);
      expect(mockExecutorchContext.embed).toHaveBeenNthCalledWith(
        1,
        'Short question',
      );
      expect(mockExecutorchContext.embed).toHaveBeenNthCalledWith(
        2,
        'User: Short question\nAssistant: Rich assistant answer with detailed information',
      );
    });

    it('passes combined-text embedding to insertInteraction', async () => {
      const insertInteractionSpy = vi.fn();
      vi.mocked(useMemoryStore).mockReturnValue({
        clear: vi.fn(),
        insertInteraction: insertInteractionSpy,
        isReady: true,
        search: vi.fn(async () => []),
        status: 'ready',
      });

      const testEmbedding = new Float32Array(384);
      testEmbedding[42] = 7;

      mockExecutorchContext.embed
        .mockResolvedValueOnce(new Float32Array(384))
        .mockResolvedValueOnce(testEmbedding);

      vi.mocked(createStreamChat).mockImplementation(() =>
        withMetrics(
          (async function* () {
            yield 'Some response';
          })(),
        ),
      );

      const { result } = await renderUseChatStream();
      await waitFor(() => expect(createProvider).toHaveBeenCalled());

      await act(async () => {
        await result.current.sendMessage('Hi');
      });

      expect(insertInteractionSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        testEmbedding,
      );
    });

    it('skips memory insertion when assistant response is empty', async () => {
      vi.mocked(createStreamChat).mockImplementation(() =>
        withMetrics(
          (async function* () {
            // empty stream — yields nothing
          })(),
        ),
      );

      const { result } = await renderUseChatStream();
      await waitFor(() => expect(createProvider).toHaveBeenCalled());

      await act(async () => {
        await result.current.sendMessage('Hi');
      });

      // embed only called once for search embedding — memory embedding skipped
      expect(mockExecutorchContext.embed).toHaveBeenCalledTimes(1);
      expect(mockExecutorchContext.embed).toHaveBeenCalledWith('Hi');
    });

    it('skips memory insertion when embedding fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        const insertInteractionSpy = vi.fn();
        vi.mocked(useMemoryStore).mockReturnValue({
          clear: vi.fn(),
          insertInteraction: insertInteractionSpy,
          isReady: true,
          search: vi.fn(async () => []),
          status: 'ready',
        });

        mockExecutorchContext.embed = vi
          .fn()
          .mockRejectedValue(new Error('Embedding model unavailable'));

        vi.mocked(createStreamChat).mockImplementation(() =>
          withMetrics(
            (async function* () {
              yield 'Some response';
            })(),
          ),
        );

        const { result } = await renderUseChatStream();
        await waitFor(() => expect(createProvider).toHaveBeenCalled());

        await act(async () => {
          await result.current.sendMessage('Hi');
        });

        // Chat still works despite embedding failure
        const assistant =
          result.current.messages[result.current.messages.length - 1];
        expect(assistant.content).toBe('Some response');
        expect(insertInteractionSpy).not.toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
      }
    });
  });
});
