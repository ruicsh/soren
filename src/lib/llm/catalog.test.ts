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
      expect(groq.apiKeyEnv).toBe('EXPO_PUBLIC_GROQ_API_KEY');
      expect(groq.baseUrl).toBe('https://api.groq.com/openai/v1');
      expect(groq.defaultModel).toBe('llama-3.1-8b-instant');
      expect(groq.modelsUrl).toBe('https://api.groq.com/openai/v1/models');
      expect(groq.type).toBe('openai-compat');
    });

    it('anthropic has correct config', () => {
      const anthropic = PROVIDERS[1];
      expect(anthropic.apiKeyEnv).toBe('EXPO_PUBLIC_ANTHROPIC_API_KEY');
      expect(anthropic.defaultModel).toBe('claude-3-5-sonnet-20240620');
      expect(anthropic.modelsUrl).toBe('https://api.anthropic.com/v1/models');
      expect(anthropic.type).toBe('anthropic');
    });
  });

  describe('createProvider', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_GROQ_API_KEY = 'groq-key';
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = 'anthropic-key';
    });

    afterEach(() => {
      delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
      delete process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    });

    it('returns null for invalid provider', () => {
      expect(createProvider('invalid', 'model')).toBeNull();
    });

    it('creates groq provider', () => {
      const provider = createProvider('groq', 'llama-3.1-8b-instant');
      expect(provider).toBeTruthy();
      expect(provider?.buildRequest).toBeDefined();
    });

    it('creates anthropic provider', () => {
      const provider = createProvider(
        'anthropic',
        'claude-3-5-sonnet-20240620',
      );
      expect(provider).toBeTruthy();
      expect(provider?.buildRequest).toBeDefined();
    });

    it('returns null if api key missing', () => {
      delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
      expect(createProvider('groq', 'model')).toBeNull();
    });
  });
});
