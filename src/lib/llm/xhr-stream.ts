import type { LLMProvider, StreamMetrics } from './types';

const DEBUG = false;
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
  const getTime =
    typeof performance !== 'undefined'
      ? () => performance.now()
      : () => Date.now();
  const t0 = getTime();
  dlog(`[LLM] XHR send() at t=0ms`);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  for (const [key, value] of Object.entries(headers)) {
    xhr.setRequestHeader(key, value);
  }

  // Timeout: if no progress for STREAM_TIMEOUT_MS, abort
  let lastProgressTime = getTime();
  const timeoutId = setInterval(() => {
    if (getTime() - lastProgressTime > STREAM_TIMEOUT_MS) {
      dlog(`[LLM] Stream timeout after ${STREAM_TIMEOUT_MS}ms`);
      xhr.abort();
      clearInterval(timeoutId);
    }
  }, 10000);

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
    clearInterval(timeoutId);
    const t = getTime() - t0;
    dlog(`[LLM] onload at t=${t.toFixed(0)}ms, status=${xhr.status}`);

    if (xhr.status < 200 || xhr.status >= 300) {
      queue.push(
        null,
        new Error(`HTTP ${xhr.status}: ${xhr.responseText.slice(0, 200)}`),
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
    clearInterval(timeoutId);
    const t = getTime() - t0;
    dlog(`[LLM] onerror at t=${t.toFixed(0)}ms`);
    queue.push(null, new Error('Network request failed'));
  };

  xhr.onabort = () => {
    clearInterval(timeoutId);
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
  let resolveNext:
    | ((item: { error?: Error; value: null | string }) => void)
    | null = null;

  return {
    next() {
      if (queue.length > 0) {
        return Promise.resolve(queue.shift()!);
      }
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },
    push(value, error) {
      if (resolveNext) {
        resolveNext({ error, value });
        resolveNext = null;
      } else {
        queue.push({ error, value });
      }
    },
  };
}

function dlog(...args: unknown[]) {
  if (DEBUG) console.log(...args);
}
