import { createProvider, PROVIDERS } from './catalog';

describe('catalog', () => {
  describe('PROVIDERS', () => {
    it('includes required providers', () => {
      expect(PROVIDERS.map((p) => p.id)).toContain('groq');
      expect(PROVIDERS.map((p) => p.id)).toContain('google');
      expect(PROVIDERS.map((p) => p.id)).toContain('anthropic');
      expect(PROVIDERS.map((p) => p.id)).toContain('opencode-go');
      expect(PROVIDERS.map((p) => p.id)).toContain('huggingface');
      expect(PROVIDERS.map((p) => p.id)).toContain('ollama-cloud');
    });

    it('ollama-cloud has correct config', () => {
      const ollama = PROVIDERS.find((p) => p.id === 'ollama-cloud');
      expect(ollama?.baseUrl).toBe('https://ollama.com/api');
      expect(ollama?.defaultModel).toBe('gpt-oss:120b');
      expect(ollama?.modelsUrl).toBe('https://ollama.com/api/tags');
      expect(ollama?.type).toBe('ollama');
    });

    it('groq has correct config', () => {
      const groq = PROVIDERS.find((p) => p.id === 'groq');
      expect(groq?.baseUrl).toBe('https://api.groq.com/openai/v1');
      expect(groq?.defaultModel).toBe('llama-3.1-8b-instant');
      expect(groq?.modelsUrl).toBe('https://api.groq.com/openai/v1/models');
      expect(groq?.type).toBe('openai-compat');
    });

    it('google has correct config', () => {
      const google = PROVIDERS.find((p) => p.id === 'google');
      expect(google?.baseUrl).toBe(
        'https://generativelanguage.googleapis.com/v1beta/openai',
      );
      expect(google?.defaultModel).toBe('gemini-1.5-flash');
      expect(google?.modelsUrl).toBe(
        'https://generativelanguage.googleapis.com/v1beta/openai/models',
      );
      expect(google?.type).toBe('openai-compat');
    });

    it('opencode-go has correct config', () => {
      const go = PROVIDERS.find((p) => p.id === 'opencode-go');
      expect(go?.baseUrl).toBe('https://opencode.ai/zen/go/v1');
      expect(go?.defaultModel).toBe('deepseek-v4-flash');
      expect(go?.modelsUrl).toBe('https://opencode.ai/zen/go/v1/models');
      expect(go?.type).toBe('openai-compat');
    });

    it('anthropic has correct config', () => {
      const anthropic = PROVIDERS.find((p) => p.id === 'anthropic');
      expect(anthropic?.defaultModel).toBe('claude-3-5-sonnet-20240620');
      expect(anthropic?.modelsUrl).toBe('https://api.anthropic.com/v1/models');
      expect(anthropic?.type).toBe('anthropic');
    });

    it('huggingface has correct config', () => {
      const hf = PROVIDERS.find((p) => p.id === 'huggingface');
      expect(hf?.baseUrl).toBe('https://router.huggingface.co/v1');
      expect(hf?.defaultModel).toBe('openai/gpt-oss-20b:fastest');
      expect(hf?.modelsUrl).toBe('https://router.huggingface.co/v1/models');
      expect(hf?.type).toBe('openai-compat');
    });
  });

  describe('createProvider', () => {
    it('creates groq provider', () => {
      const provider = createProvider('groq', 'llama-3.1-8b-instant', 'key');
      expect(provider).toBeTruthy();
      expect(provider?.buildRequest).toBeDefined();
    });

    it('creates huggingface provider', () => {
      const provider = createProvider(
        'huggingface',
        'openai/gpt-oss-20b:fastest',
        'key',
      );
      expect(provider).toBeTruthy();
      expect(provider?.buildRequest).toBeDefined();
    });

    it('creates opencode-go provider', () => {
      const provider = createProvider(
        'opencode-go',
        'deepseek-v4-flash',
        'key',
      );
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
