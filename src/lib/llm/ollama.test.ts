import { ollamaProvider } from './ollama';

describe('ollamaProvider', () => {
  const provider = ollamaProvider({
    apiKey: 'test-key',
    baseUrl: 'https://ollama.com/api',
    model: 'gpt-oss:120b',
  });

  describe('buildRequest', () => {
    it('returns correct URL, headers, and body', () => {
      const messages = [{ content: 'Hello', role: 'user' as const }];
      const req = provider.buildRequest(messages);

      expect(req.url).toBe('https://ollama.com/api/chat');
      expect(req.headers['Content-Type']).toBe('application/json');
      expect(req.headers.Authorization).toBe('Bearer test-key');

      const body = JSON.parse(req.body);
      expect(body.model).toBe('gpt-oss:120b');
      expect(body.messages).toEqual(messages);
      expect(body.stream).toBe(true);
    });
  });

  describe('parseChunk', () => {
    it('extracts content from NDJSON lines', () => {
      const lines = [
        '{"message": {"role": "assistant", "content": "Hi"}}',
        '{"message": {"role": "assistant", "content": " there"}}',
      ];

      const deltas = provider.parseChunk(lines);

      expect(deltas).toEqual(['Hi', ' there']);
    });

    it('skips empty content', () => {
      const lines = [
        '{"message": {"role": "assistant", "content": ""}}',
        '{"message": {"role": "assistant", "content": "Ok"}}',
      ];

      const deltas = provider.parseChunk(lines);

      expect(deltas).toEqual(['Ok']);
    });
  });

  describe('isDone', () => {
    it('returns true when done: true is present', () => {
      const lines = [
        '{"message": {"content": "hi"}, "done": false}',
        '{"done": true}',
      ];

      expect(provider.isDone(lines)).toBe(true);
    });

    it('returns false when done: true is not present', () => {
      const lines = ['{"message": {"content": "hi"}, "done": false}'];

      expect(provider.isDone(lines)).toBe(false);
    });
  });

  it('sets streamFormat to ndjson', () => {
    expect(provider.streamFormat).toBe('ndjson');
  });
});
