import { vi } from 'vitest';

import { clearModelCache, fetchModels } from './models';

// Mock global fetch
(globalThis as any).fetch = vi.fn();

describe('models', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearModelCache();
  });

  it('fetches and filters models for groq', async () => {
    const mockModels = {
      data: [
        { id: 'llama-3.1-8b-instant' },
        { id: 'whisper-large' }, // should be filtered out
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockModels),
      ok: true,
    } as any);

    const models = await fetchModels('groq', 'test-key');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('llama-3.1-8b-instant');
  });

  it('fetches and filters models for opencode-go', async () => {
    const mockModels = {
      data: [
        { id: 'deepseek-v4-flash' },
        { id: 'glm-5.1' },
        { id: 'kimi-k2.6' },
        { id: 'mimo-v2.5' },
        { id: 'minimax-m2.7' },
        { id: 'other-model' }, // should be filtered out
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockModels),
      ok: true,
    } as any);

    const models = await fetchModels('opencode-go', 'test-key');

    expect(fetch).toHaveBeenCalledWith(
      'https://opencode.ai/zen/go/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
    expect(models).toHaveLength(5);
    expect(models.map((m) => m.id)).toContain('deepseek-v4-flash');
    expect(models.map((m) => m.id)).toContain('glm-5.1');
  });

  it('fetches and filters models for anthropic', async () => {
    const mockModels = {
      data: [
        { id: 'claude-3-5-sonnet-20240620' },
        { id: 'claude-3-haiku-20240307' },
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockModels),
      ok: true,
    } as any);

    const models = await fetchModels('anthropic', 'ant-key');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          'anthropic-version': '2023-06-01',
          'x-api-key': 'ant-key',
        }),
      }),
    );
    expect(models).toHaveLength(2);
  });

  it('returns all models if no chat markers found (fail-open)', async () => {
    const mockModels = {
      data: [{ id: 'mystery-model-v1' }],
    };

    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockModels),
      ok: true,
    } as any);

    const models = await fetchModels('groq', 'key');
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('mystery-model-v1');
  });

  it('throws if api key missing', async () => {
    await expect(fetchModels('groq', '')).rejects.toThrow(
      'Missing API Key for Groq',
    );
  });

  it('throws on api error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    } as any);

    await expect(fetchModels('groq', 'key')).rejects.toThrow('401');
  });
});
