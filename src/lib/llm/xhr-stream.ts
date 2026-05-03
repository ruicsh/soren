import type { LLMProvider, StreamMetrics } from './types';

const DEBUG = false;

function dlog(...args: unknown[]) {
  if (DEBUG) console.log(...args);
}

interface StreamQueue {
  push: (value: string | null, error?: Error) => void;
  next: () => Promise<{ value: string | null; error?: Error }>;
}

function createStreamQueue(): StreamQueue {
  const queue: { value: string | null; error?: Error }[] = [];
  let resolveNext:
    | ((item: { value: string | null; error?: Error }) => void)
    | null = null;

  return {
    push(value, error) {
      if (resolveNext) {
        resolveNext({ value, error });
        resolveNext = null;
      } else {
        queue.push({ value, error });
      }
    },
    next() {
      if (queue.length > 0) {
        return Promise.resolve(queue.shift()!);
      }
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },
  };
}

export function createStreamChat(
  provider: LLMProvider,
  messages: { role: string; content: string }[],
  onAbort?: () => boolean,
): AsyncGenerator<string> & { metrics: StreamMetrics } {
  const queue = createStreamQueue();
  let buffer = '';
  let responsePos = 0;
  let progressCount = 0;

  const metrics: StreamMetrics = {
    headersTime: null,
    firstTokenTime: null,
  };

  const { url, headers, body } = provider.buildRequest(messages);
  const t0 = performance.now();
  dlog(`[LLM] XHR send() at t=0ms`);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  for (const [key, value] of Object.entries(headers)) {
    xhr.setRequestHeader(key, value);
  }

  xhr.onreadystatechange = () => {
    const t = performance.now() - t0;
    if (xhr.readyState === 1) {
      dlog(`[LLM] readyState=OPENED at t=${t.toFixed(0)}ms`);
    } else if (xhr.readyState === 2 && metrics.headersTime === null) {
      metrics.headersTime = performance.now();
      dlog(`[LLM] readyState=HEADERS_RECEIVED at t=${t.toFixed(0)}ms`);
    } else if (xhr.readyState === 3) {
      dlog(`[LLM] readyState=LOADING at t=${t.toFixed(0)}ms`);
    } else if (xhr.readyState === 4) {
      dlog(`[LLM] readyState=DONE at t=${t.toFixed(0)}ms`);
    }
  };

  xhr.onprogress = () => {
    progressCount++;
    const t = performance.now() - t0;
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
          metrics.firstTokenTime = performance.now();
          const tt = metrics.firstTokenTime - t0;
          dlog(`[LLM] First token at t=${tt.toFixed(0)}ms`);
        }
        queue.push(delta);
      }

      boundary = buffer.indexOf('\n\n');
    }
  };

  xhr.onload = () => {
    const t = performance.now() - t0;
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
          metrics.firstTokenTime = performance.now();
        }
        queue.push(delta);
      }
    }
    queue.push(null);
  };

  xhr.onerror = () => {
    const t = performance.now() - t0;
    dlog(`[LLM] onerror at t=${t.toFixed(0)}ms`);
    queue.push(null, new Error('Network request failed'));
  };

  xhr.onabort = () => {
    const t = performance.now() - t0;
    dlog(`[LLM] onabort at t=${t.toFixed(0)}ms`);
    queue.push(null);
  };

  xhr.send(body);

  const generator = (async function* () {
    while (true) {
      const { value, error } = await queue.next();
      if (error) throw error;
      if (value === null) return;
      yield value;
    }
  })();

  return Object.assign(generator, { metrics });
}
