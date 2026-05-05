import { anthropicProvider } from './anthropic';

describe('anthropicProvider', () => {
  const provider = anthropicProvider({
    apiKey: 'sk-ant-test',
    model: 'claude-sonnet-4-20250514',
  });

  describe('buildRequest', () => {
    it('returns correct URL, headers, and body', () => {
      const messages = [{ content: 'Hello', role: 'user' as const }];
      const req = provider.buildRequest(messages);

      expect(req.url).toBe('https://api.anthropic.com/v1/messages');
      expect(req.headers['Content-Type']).toBe('application/json');
      expect(req.headers['x-api-key']).toBe('sk-ant-test');
      expect(req.headers['anthropic-version']).toBe('2024-01-01');

      const body = JSON.parse(req.body);
      expect(body.model).toBe('claude-sonnet-4-20250514');
      expect(body.max_tokens).toBe(4096);
      expect(body.stream).toBe(true);
      expect(body.messages).toEqual(messages);
    });

    it('extracts system message to top-level param', () => {
      const messages = [
        { content: 'You are helpful.', role: 'system' as const },
        { content: 'Hi', role: 'user' as const },
      ];
      const req = provider.buildRequest(messages);
      const body = JSON.parse(req.body);

      expect(body.system).toBe('You are helpful.');
      expect(body.messages).toEqual([{ content: 'Hi', role: 'user' }]);
    });

    it('omits system param when no system message', () => {
      const messages = [{ content: 'Hi', role: 'user' as const }];
      const req = provider.buildRequest(messages);
      const body = JSON.parse(req.body);

      expect(body).not.toHaveProperty('system');
      expect(body.messages).toEqual(messages);
    });

    it('uses custom maxTokens', () => {
      const customProvider = anthropicProvider({
        apiKey: 'key',
        maxTokens: 1024,
        model: 'claude-sonnet-4-20250514',
      });
      const req = customProvider.buildRequest([
        { content: 'Hi', role: 'user' as const },
      ]);
      const body = JSON.parse(req.body);

      expect(body.max_tokens).toBe(1024);
    });

    it('defaults maxTokens to 4096', () => {
      const req = provider.buildRequest([
        { content: 'Hi', role: 'user' as const },
      ]);
      const body = JSON.parse(req.body);

      expect(body.max_tokens).toBe(4096);
    });
  });

  describe('parseChunk', () => {
    it('extracts text from content_block_delta events', () => {
      const lines = [
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['Hello', ' world']);
    });

    it('ignores non-content_block_delta events', () => {
      const lines = [
        'event: message_start',
        'data: {"type":"message_start","message":{"id":"msg_123"}}',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['Hi']);
    });

    it('skips empty text deltas', () => {
      const lines = [
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":""}}',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ok"}}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['ok']);
    });

    it('skips malformed JSON', () => {
      const lines = [
        'event: content_block_delta',
        'data: {broken json}',
        'event: content_block_delta',
        'data: {"delta":{"type":"text_delta","text":"good"}}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['good']);
    });

    it('ignores non-data lines', () => {
      const lines = [
        '',
        'event: content_block_delta',
        'data: {"delta":{"text":"yes"}}',
        'just random text',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['yes']);
    });

    it('returns empty array for no content', () => {
      const lines = ['event: message_start', 'data: {"type":"message_start"}'];

      expect(provider.parseChunk(lines)).toEqual([]);
    });

    it('resets event type across chunks', () => {
      const lines = [
        'event: message_start',
        'data: {"type":"message_start"}',
        'event: content_block_delta',
        'data: {"delta":{"text":"first"}}',
        'event: message_stop',
        'data: {"type":"message_stop"}',
      ];

      // message_start and message_stop events should not yield deltas
      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['first']);
    });
  });

  describe('isDone', () => {
    it('returns true when message_stop event is present', () => {
      const lines = [
        'event: content_block_delta',
        'data: {"delta":{"text":"hi"}}',
        'event: message_stop',
        'data: {"type":"message_stop"}',
      ];

      expect(provider.isDone(lines)).toBe(true);
    });

    it('returns false when message_stop is not present', () => {
      const lines = [
        'event: content_block_delta',
        'data: {"delta":{"text":"hi"}}',
      ];

      expect(provider.isDone(lines)).toBe(false);
    });

    it('returns false for empty lines', () => {
      expect(provider.isDone([])).toBe(false);
    });
  });
});
