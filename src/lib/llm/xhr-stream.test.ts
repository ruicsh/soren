import type { LLMProvider } from './types';

function createMockProvider(): LLMProvider {
  return {
    buildRequest(messages) {
      return {
        body: JSON.stringify({ messages, model: 'test-model', stream: true }),
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
        url: 'https://api.test.com/v1/chat/completions',
      };
    },

    isDone(lines) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed.slice(6) === '[DONE]') {
          return true;
        }
      }

      return false;
    },

    parseChunk(lines) {
      const deltas: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content.length > 0) {
            deltas.push(content);
          }
        } catch {
          // ignore
        }
      }

      return deltas;
    },
    warmup: () => {},
  };
}

describe('createStreamChat', () => {
  it('builds correct request from provider config', () => {
    const provider = createMockProvider();
    const messages = [
      { content: 'Be brief.', role: 'system' as const },
      { content: 'Hello', role: 'user' as const },
    ];

    const { body, headers, url } = provider.buildRequest(messages);

    expect(url).toBe('https://api.test.com/v1/chat/completions');
    expect(headers.Authorization).toBe('Bearer test-key');
    expect(headers['Content-Type']).toBe('application/json');

    const parsed = JSON.parse(body);
    expect(parsed.model).toBe('test-model');
    expect(parsed.messages).toEqual(messages);
    expect(parsed.stream).toBe(true);
  });
});

describe('SSE parsing via provider', () => {
  const provider = createMockProvider();

  it('parses content from SSE data lines', () => {
    const lines = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      'data: {"choices":[{"delta":{"content":" world"}}]}',
    ];
    expect(provider.parseChunk(lines)).toEqual(['Hello', ' world']);
  });

  it('skips empty content deltas', () => {
    const lines = [
      'data: {"choices":[{"delta":{"content":""}}]}',
      'data: {"choices":[{"delta":{"role":"assistant","content":""}}]}',
      'data: {"choices":[{"delta":{"content":"Ok"}}]}',
    ];
    expect(provider.parseChunk(lines)).toEqual(['Ok']);
  });

  it('skips non-data lines', () => {
    const lines = [
      '',
      'event: ping',
      'data: {"choices":[{"delta":{"content":"yes"}}]}',
      'just some text',
    ];
    expect(provider.parseChunk(lines)).toEqual(['yes']);
  });

  it('skips malformed JSON', () => {
    const lines = [
      'data: {invalid json}',
      'data: {"choices":[{"delta":{"content":"good"}}]}',
    ];
    expect(provider.parseChunk(lines)).toEqual(['good']);
  });

  it('skips [DONE] sentinel', () => {
    const lines = [
      'data: {"choices":[{"delta":{"content":"end"}}]}',
      'data: [DONE]',
    ];
    expect(provider.parseChunk(lines)).toEqual(['end']);
  });

  it('detects [DONE] in isDone', () => {
    expect(provider.isDone(['data: [DONE]'])).toBe(true);
    expect(
      provider.isDone(['data: {"choices":[{"delta":{"content":"hi"}}]}']),
    ).toBe(false);
    expect(provider.isDone([])).toBe(false);
  });

  it('handles multi-line chunk splitting', () => {
    // Simulates a chunk with multiple SSE events separated by \n
    const lines = [
      'data: {"choices":[{"delta":{"content":"A"}}]}',
      'data: {"choices":[{"delta":{"content":"B"}}]}',
      'data: {"choices":[{"delta":{"content":"C"}}]}',
    ];
    expect(provider.parseChunk(lines)).toEqual(['A', 'B', 'C']);
  });

  it('returns empty array for no content', () => {
    const lines = [
      'data: {"choices":[{"delta":{"role":"assistant"}}]}',
      'data: [DONE]',
    ];
    expect(provider.parseChunk(lines)).toEqual([]);
  });
});

describe('Anthropic-style SSE parsing', () => {
  const anthropicProvider: LLMProvider = {
    buildRequest() {
      return {
        body: '{}',
        headers: {
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'x-api-key': 'test',
        },
        url: 'https://api.anthropic.com/v1/messages',
      };
    },

    isDone(lines) {
      for (const line of lines) {
        if (line.trim() === 'event: message_stop') return true;
      }

      return false;
    },

    parseChunk(lines) {
      let eventType = '';
      const deltas: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event: ')) {
          eventType = trimmed.slice(7);
          continue;
        }
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (eventType === 'content_block_delta') {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.delta?.text;
            if (typeof text === 'string' && text.length > 0) {
              deltas.push(text);
            }
          } catch {
            // ignore
          }
        }
      }

      return deltas;
    },
  };

  it('extracts text from content_block_delta events only', () => {
    const lines = [
      'event: message_start',
      'data: {"type":"message_start"}',
      'event: content_block_delta',
      'data: {"delta":{"type":"text_delta","text":"Hello"}}',
      'event: content_block_delta',
      'data: {"delta":{"type":"text_delta","text":"!"}}',
    ];
    expect(anthropicProvider.parseChunk(lines)).toEqual(['Hello', '!']);
  });

  it('ignores non-content events', () => {
    const lines = [
      'event: message_start',
      'data: {"type":"message_start"}',
      'event: content_block_delta',
      'data: {"delta":{"type":"text_delta","text":"yes"}}',
      'event: message_stop',
      'data: {"type":"message_stop"}',
    ];
    expect(anthropicProvider.parseChunk(lines)).toEqual(['yes']);
  });

  it('detects message_stop in isDone', () => {
    expect(anthropicProvider.isDone(['event: message_stop'])).toBe(true);
    expect(anthropicProvider.isDone(['event: content_block_delta'])).toBe(
      false,
    );
  });
});
