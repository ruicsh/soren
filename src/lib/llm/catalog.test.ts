import { createProvider, PROVIDERS } from './catalog';

describe('catalog', () => {
  describe('PROVIDERS', () => {
    it('includes groq and anthropic', () => {
      expect(PROVIDERS).toHaveLength(2);
      expect(PROVIDERS[0].id).toBe('groq');
      expect(PROVIDERS[1].id).toBe('anthropic');
    });

    it('groq has correct config', () => {
      const groq = PROVIDERS[0];
      expect(groq.baseUrl).toBe('https://api.groq.com/openai/v1');
      expect(groq.defaultModel).toBe('llama-3.1-8b-instant');
      expect(groq.modelsUrl).toBe('https://api.groq.com/openai/v1/models');
      expect(groq.type).toBe('openai-compat');
    });

    it('anthropic has correct config', () => {
      const anthropic = PROVIDERS[1];
      expect(anthropic.defaultModel).toBe('claude-3-5-sonnet-20240620');
      expect(anthropic.modelsUrl).toBe('https://api.anthropic.com/v1/models');
      expect(anthropic.type).toBe('anthropic');
    });
  });

  describe('createProvider', () => {
    it('creates groq provider', () => {
      const provider = createProvider('groq', 'llama-3.1-8b-instant', 'key');
      expect(provider).toBeTruthy();
      expect(provider?.buildRequest).toBeDefined();
    });

    it('creates anthropic provider', () => {
      const provider = createProvider(
        'anthropic',
        'claude-3-5-sonnet-20240620',
        'key',
      );
      expect(provider).toBeTruthy();
      expect(provider?.buildRequest).toBeDefined();
    });

    it('returns null if provider unknown', () => {
      expect(createProvider('invalid', 'model', 'key')).toBeNull();
    });

    it('returns null if api key missing', () => {
      expect(createProvider('groq', 'model', '')).toBeNull();
    });
  });
});
