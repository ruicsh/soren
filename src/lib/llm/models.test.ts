import { vi } from 'vitest';

import { clearModelCache, fetchModels } from './models';

describe('models', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearModelCache();
    (globalThis as any).fetch = vi.fn();
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
  });

  it('fetches and filters models for groq', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [
            { id: 'llama-3.1-8b-instant' },
            { id: 'distil-whisper-large-v3-en' }, // excluded
            { id: 'gemma2-9b-it' },
          ],
        }),
      ok: true,
    } as any);

    const models = await fetchModels('groq');

    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('gemma2-9b-it');
    expect(models[1].id).toBe('llama-3.1-8b-instant');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('fetches and filters models for anthropic', async () => {
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = 'ant-key';
    vi.mocked(fetch).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [
            { id: 'claude-3-5-sonnet-20240620' },
            { id: 'claude-3-haiku-20240307' },
          ],
        }),
      ok: true,
    } as any);

    const models = await fetchModels('anthropic');

    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('claude-3-5-sonnet-20240620');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          'anthropic-version': '2023-06-01',
          'x-api-key': 'ant-key',
        }),
      }),
    );
    delete process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  });

  it('returns all models if no chat markers found (fail-open)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: [{ id: 'mystery-model-v1' }],
        }),
      ok: true,
    } as any);

    const models = await fetchModels('groq');
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('mystery-model-v1');
  });

  it('throws if api key missing', async () => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    await expect(fetchModels('groq')).rejects.toThrow('Missing API Key');
  });

  it('throws on api error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    } as any);

    await expect(fetchModels('groq')).rejects.toThrow('401');
  });
});
