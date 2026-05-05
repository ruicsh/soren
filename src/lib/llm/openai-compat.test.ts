import { openaiCompatProvider } from './openai-compat';

describe('openaiCompatProvider', () => {
  const provider = openaiCompatProvider({
    apiKey: 'test-key',
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-4o-mini',
  });

  describe('buildRequest', () => {
    it('returns correct URL, headers, and body', () => {
      const messages = [{ content: 'Hello', role: 'user' as const }];
      const req = provider.buildRequest(messages);

      expect(req.url).toBe('https://api.example.com/v1/chat/completions');
      expect(req.headers['Content-Type']).toBe('application/json');
      expect(req.headers.Authorization).toBe('Bearer test-key');

      const body = JSON.parse(req.body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages).toEqual(messages);
      expect(body.stream).toBe(true);
    });

    it('includes extraBody params', () => {
      const providerWithExtra = openaiCompatProvider({
        apiKey: 'key',
        baseUrl: 'https://api.example.com/v1',
        extraBody: { thinking: { type: 'disabled' } },
        model: 'deepseek-v4-flash',
      });

      const req = providerWithExtra.buildRequest([
        { content: 'hi', role: 'user' as const },
      ]);
      const body = JSON.parse(req.body);

      expect(body.thinking).toEqual({ type: 'disabled' });
      expect(body.model).toBe('deepseek-v4-flash');
    });

    it('does not include extraBody when not provided', () => {
      const req = provider.buildRequest([
        { content: 'hi', role: 'user' as const },
      ]);
      const body = JSON.parse(req.body);

      expect(body).not.toHaveProperty('thinking');
    });
  });

  describe('parseChunk', () => {
    it('extracts content from SSE lines', () => {
      const lines = [
        'data: {"choices":[{"delta":{"content":"Hi"}}]}',
        'data: {"choices":[{"delta":{"content":" there"}}]}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['Hi', ' there']);
    });

    it('skips empty content deltas', () => {
      const lines = [
        'data: {"choices":[{"delta":{"content":""}}]}',
        'data: {"choices":[{"delta":{"role":"assistant","content":""}}]}',
        'data: {"choices":[{"delta":{"content":"Ok"}}]}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['Ok']);
    });

    it('skips non-data lines', () => {
      const lines = [
        '',
        'event: ping',
        'data: {"choices":[{"delta":{"content":"yes"}}]}',
        'just some text',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['yes']);
    });

    it('skips malformed JSON', () => {
      const lines = [
        'data: {invalid json}',
        'data: {"choices":[{"delta":{"content":"good"}}]}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['good']);
    });

    it('skips [DONE]', () => {
      const lines = [
        'data: {"choices":[{"delta":{"content":"end"}}]}',
        'data: [DONE]',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['end']);
    });

    it('skips reasoning_content', () => {
      const lines = [
        'data: {"choices":[{"delta":{"role":"assistant","content":null,"reasoning_content":"thinking..."}}]}',
        'data: {"choices":[{"delta":{"content":"answer"}}]}',
      ];

      const deltas = provider.parseChunk(lines);
      expect(deltas).toEqual(['answer']);
    });

    it('returns empty array for no content', () => {
      const lines = [
        'data: {"choices":[{"delta":{"role":"assistant"}}]}',
        'data: [DONE]',
      ];

      expect(provider.parseChunk(lines)).toEqual([]);
    });
  });

  describe('isDone', () => {
    it('returns true when [DONE] is present', () => {
      const lines = [
        'data: {"choices":[{"delta":{"content":"hi"}}]}',
        'data: [DONE]',
      ];

      expect(provider.isDone(lines)).toBe(true);
    });

    it('returns false when [DONE] is not present', () => {
      const lines = ['data: {"choices":[{"delta":{"content":"hi"}}]}'];

      expect(provider.isDone(lines)).toBe(false);
    });

    it('returns false for empty lines', () => {
      expect(provider.isDone([])).toBe(false);
    });
  });
});
