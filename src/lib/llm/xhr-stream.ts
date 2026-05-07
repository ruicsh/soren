import { LLMError, type LLMProvider, type StreamMetrics } from './types';

const DEBUG = process.env.EXPO_PUBLIC_DEBUG_XHR_STREAM === '1';
const STREAM_TIMEOUT_MS = 60000;

interface StreamQueue {
  next: () => Promise<{ error?: Error; value: null | string }>;
  push: (value: null | string, error?: Error) => void;
}

export function createStreamChat(
  provider: LLMProvider,
  messages: { content: string; role: 'assistant' | 'system' | 'user' }[],
  onAbort?: () => boolean,
): AsyncGenerator<string> & { metrics: StreamMetrics } {
  const queue = createStreamQueue();
  let buffer = '';
  let responsePos = 0;
  let progressCount = 0;

  const metrics: StreamMetrics = {
    firstTokenTime: null,
    headersTime: null,
  };

  const { body, headers, url } = provider.buildRequest(messages);
  const getTime = () => Date.now();
  const t0 = getTime();
  dlog(`[LLM] XHR send() at t=0ms`);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  for (const [key, value] of Object.entries(headers)) {
    xhr.setRequestHeader(key, value);
  }

  // Timeout: if no progress for STREAM_TIMEOUT_MS, abort
  let lastProgressTime = getTime();
  const timeoutId =
    STREAM_TIMEOUT_MS > 0
      ? setInterval(() => {
          if (getTime() - lastProgressTime > STREAM_TIMEOUT_MS) {
            dlog(`[LLM] Stream timeout after ${STREAM_TIMEOUT_MS}ms`);
            xhr.abort();
            if (timeoutId) clearInterval(timeoutId);
          }
        }, 10000)
      : null;

  xhr.onreadystatechange = () => {
    const t = getTime() - t0;
    if (xhr.readyState === 1) {
      dlog(`[LLM] readyState=OPENED at t=${t.toFixed(0)}ms`);
    } else if (xhr.readyState === 2 && metrics.headersTime === null) {
      metrics.headersTime = getTime();
      dlog(`[LLM] readyState=HEADERS_RECEIVED at t=${t.toFixed(0)}ms`);
    } else if (xhr.readyState === 3) {
      dlog(`[LLM] readyState=LOADING at t=${t.toFixed(0)}ms`);
    } else if (xhr.readyState === 4) {
      dlog(`[LLM] readyState=DONE at t=${t.toFixed(0)}ms`);
    }
  };

  xhr.onprogress = () => {
    lastProgressTime = getTime();
    progressCount++;
    const t = getTime() - t0;
    const newText = xhr.responseText.slice(responsePos);
    const newTextLen = newText.length;
    responsePos = xhr.responseText.length;
    buffer += newText;

    if (progressCount <= 5) {
      dlog(
        `[LLM] onprogress #${progressCount} at t=${t.toFixed(0)}ms, +${newTextLen} chars, total=${responsePos}`,
      );
    }

    if (onAbort?.()) {
      xhr.abort();

      return;
    }

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const lines = chunk.split('\n');

      if (provider.isDone(lines)) {
        queue.push(null);

        return;
      }

      const deltas = provider.parseChunk(lines);
      for (const delta of deltas) {
        if (metrics.firstTokenTime === null) {
          const ft = getTime();
          metrics.firstTokenTime = ft;
          const tt = ft - t0;
          dlog(`[LLM] First token at t=${tt.toFixed(0)}ms`);
        }
        queue.push(delta);
      }

      boundary = buffer.indexOf('\n\n');
    }
  };

  xhr.onload = () => {
    if (timeoutId) clearInterval(timeoutId);
    const t = getTime() - t0;
    dlog(`[LLM] onload at t=${t.toFixed(0)}ms, status=${xhr.status}`);

    if (xhr.status < 200 || xhr.status >= 300) {
      const responseText = xhr.responseText;
      let errorMessage = `HTTP ${xhr.status}: ${responseText.slice(0, 200)}`;
      let isTransient = xhr.status >= 500 || xhr.status === 429;
      let errorCode: string | undefined;

      // Special case for common status codes if JSON parsing fails
      if (xhr.status === 429) {
        errorMessage = 'Rate limit reached. Retrying...';
      } else if (xhr.status === 503) {
        errorMessage = 'Model busy. Retrying...';
      }

      try {
        const parsed = JSON.parse(responseText);
        const error = parsed.error || parsed;
        errorMessage = error.message || errorMessage;
        errorCode = error.code;

        // If it's a 429, check if it's quota vs rate limit
        if (xhr.status === 429) {
          const isQuota =
            errorMessage.toLowerCase().includes('quota') ||
            errorMessage.toLowerCase().includes('billing') ||
            errorCode === 'insufficient_quota';
          isTransient = !isQuota;
          if (isQuota) {
            errorMessage = 'Quota reached for this provider key.';
          } else {
            errorMessage = 'Rate limit reached. Retrying...';
          }
        } else if (xhr.status === 503) {
          errorMessage = 'Model busy. Retrying...';
        } else if (xhr.status >= 500) {
          errorMessage = 'Provider internal error. Retrying...';
        }
      } catch {
        // use default error message
      }

      queue.push(
        null,
        new LLMError(errorMessage, xhr.status, errorCode, isTransient),
      );

      return;
    }

    if (buffer.trim()) {
      const lines = buffer.split('\n');
      const deltas = provider.parseChunk(lines);
      for (const delta of deltas) {
        if (metrics.firstTokenTime === null) {
          metrics.firstTokenTime = getTime();
        }
        queue.push(delta);
      }
    }
    queue.push(null);
  };

  xhr.onerror = () => {
    if (timeoutId) clearInterval(timeoutId);
    const t = getTime() - t0;
    dlog(`[LLM] onerror at t=${t.toFixed(0)}ms`);
    queue.push(null, new Error('Network request failed'));
  };

  xhr.onabort = () => {
    if (timeoutId) clearInterval(timeoutId);
    const t = getTime() - t0;
    dlog(`[LLM] onabort at t=${t.toFixed(0)}ms`);
    queue.push(null);
  };

  xhr.send(body);

  const generator = (async function* () {
    while (true) {
      const { error, value } = await queue.next();
      if (error) throw error;
      if (value === null) return;
      yield value;
    }
  })();

  return Object.assign(generator, { metrics });
}

function createStreamQueue(): StreamQueue {
  const queue: { error?: Error; value: null | string }[] = [];
  const waiters: ((item: { error?: Error; value: null | string }) => void)[] =
    [];

  return {
    next() {
      if (queue.length > 0) {
        return Promise.resolve(queue.shift()!);
      }

      return new Promise((resolve) => {
        waiters.push(resolve);
      });
    },
    push(value, error) {
      if (waiters.length > 0) {
        const resolve = waiters.shift()!;
        resolve({ error, value });
      } else {
        queue.push({ error, value });
      }
    },
  };
}

function dlog(...args: unknown[]) {
  if (DEBUG) console.log(...args);
}
