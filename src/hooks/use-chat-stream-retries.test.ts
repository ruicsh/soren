import { act, renderHook, waitFor } from '@testing-library/react-native';
import { vi } from 'vitest';

import { createProvider } from '@/lib/llm/catalog';
import { LLMError } from '@/lib/llm/types';
import { createStreamChat } from '@/lib/llm/xhr-stream';

import { useChatStream } from './use-chat-stream';

vi.mock('@/lib/byok-keys', () => ({
  getApiKey: vi.fn(() => Promise.resolve('mock-key')),
}));

vi.mock('@/lib/llm/catalog', () => ({
  createProvider: vi.fn(() => ({
    buildRequest: vi.fn(() => ({ body: '', headers: {}, url: '' })),
    isDone: vi.fn(() => false),
    parseChunk: vi.fn(() => []),
    warmup: vi.fn(),
  })),
}));

vi.mock('@/lib/llm/xhr-stream', () => ({
  createStreamChat: vi.fn(),
}));

describe('useChatStream retries', () => {
  it('retries on transient errors and eventually succeeds', async () => {
    let calls = 0;
    vi.mocked(createStreamChat).mockImplementation(() => {
      calls++;
      if (calls === 1) {
        throw new LLMError('Rate limit', 429, 'rate_limit', true);
      }

      return (async function* () {
        yield 'Success after retry';
      })() as any;
    });

    const { result } = renderHook(() =>
      useChatStream({
        chatbotUuid: 'u1',
        providerId: 'p1',
        providerModel: 'm1',
      }),
    );

    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // Should have called createStreamChat twice
    expect(calls).toBe(2);
    const assistant =
      result.current.messages[result.current.messages.length - 1];
    // Should contain the retry indicator and the final success text
    expect(assistant.content).toContain('Retry 1/2');
    expect(assistant.content).toContain('Success after retry');
  });

  it('stops retrying after MAX_RETRIES', async () => {
    let calls = 0;
    vi.mocked(createStreamChat).mockImplementation(() => {
      calls++;
      throw new LLMError('Internal Error', 500, undefined, true);
    });

    const { result } = renderHook(() =>
      useChatStream({
        chatbotUuid: 'u1',
        providerId: 'p1',
        providerModel: 'm1',
      }),
    );

    // Wait for history to load
    await waitFor(() => expect(result.current.messages).toEqual([]));
    // Wait for provider to resolve
    await waitFor(() => expect(createProvider).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // Initial call + 2 retries = 3
    expect(calls).toBe(3);
    const assistant =
      result.current.messages[result.current.messages.length - 1];
    expect(assistant.content).toContain('Internal Error');
  });
});
