import { vi } from 'vitest';

import { LLMError } from './types';
import { createStreamChat } from './xhr-stream';

const mockProvider = {
  buildRequest: vi.fn(() => ({
    body: '{}',
    headers: {},
    url: 'https://api.test.com',
  })),
  isDone: vi.fn(() => false),
  parseChunk: vi.fn(() => []),
};

describe('createStreamChat errors', () => {
  function setupXhrMock(status: number, responseText: string) {
    const originalXHR = (globalThis as any).XMLHttpRequest;

    (globalThis as any).XMLHttpRequest = function (this: any) {
      this.onreadystatechange = null;
      this.onload = null;
      this.status = 0;
      this.responseText = '';
      this.readyState = 0;
      this.open = () => {};
      this.setRequestHeader = () => {};
      this.send = () => {
        setTimeout(() => {
          this.status = status;
          this.responseText = responseText;
          this.readyState = 4;
          if (this.onreadystatechange) this.onreadystatechange();
          if (this.onload) this.onload();
        }, 10);
      };
    };

    return () => {
      (globalThis as any).XMLHttpRequest = originalXHR;
    };
  }

  it('parses structured JSON errors and identifies transient status', async () => {
    const restore = setupXhrMock(
      429,
      JSON.stringify({
        error: { code: 'rate_limit', message: 'Rate limit exceeded' },
      }),
    );

    try {
      const stream = createStreamChat(mockProvider as any, []);
      await stream.next();
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError);
      const llmErr = err as LLMError;
      expect(llmErr.message).toBe('Rate limit reached. Retrying...');
      expect(llmErr.isTransient).toBe(true);
      expect(llmErr.status).toBe(429);
    } finally {
      restore();
    }
  });

  it('identifies quota exhausted as non-transient', async () => {
    const restore = setupXhrMock(
      429,
      JSON.stringify({
        error: {
          code: 'insufficient_quota',
          message: 'You exceeded your current quota',
        },
      }),
    );

    try {
      const stream = createStreamChat(mockProvider as any, []);
      await stream.next();
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError);
      const llmErr = err as LLMError;
      expect(llmErr.message).toBe('Quota reached for this provider key.');
      expect(llmErr.isTransient).toBe(false);
    } finally {
      restore();
    }
  });

  it('handles 503 as transient', async () => {
    const restore = setupXhrMock(503, 'Service Unavailable');

    try {
      const stream = createStreamChat(mockProvider as any, []);
      await stream.next();
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError);
      const llmErr = err as LLMError;
      expect(llmErr.message).toBe('Model busy. Retrying...');
      expect(llmErr.isTransient).toBe(true);
    } finally {
      restore();
    }
  });
});
