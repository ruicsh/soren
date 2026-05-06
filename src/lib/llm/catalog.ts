import type { LLMProvider } from './types';

import { anthropicProvider } from './anthropic';
import { openaiCompatProvider } from './openai-compat';

export interface ProviderEntry {
  apiKeyEnv: string;
  baseUrl?: string;
  defaultModel: string;
  id: string;
  label: string;
  modelsUrl: string;
  type: 'anthropic' | 'openai-compat';
}

export const PROVIDERS: ProviderEntry[] = [
  {
    apiKeyEnv: 'EXPO_PUBLIC_GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    id: 'groq',
    label: 'Groq',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    type: 'openai-compat',
  },
  {
    apiKeyEnv: 'EXPO_PUBLIC_ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20240620',
    id: 'anthropic',
    label: 'Anthropic',
    modelsUrl: 'https://api.anthropic.com/v1/models',
    type: 'anthropic',
  },
];

export function createProvider(id: string, model: string): LLMProvider | null {
  const entry = PROVIDERS.find((p) => p.id === id);

  if (!entry) return null;

  const apiKey = getApiKey(entry) || '';

  if (!apiKey) return null;

  if (entry.type === 'openai-compat') {
    return openaiCompatProvider({
      apiKey,
      baseUrl: entry.baseUrl!,
      model,
    });
  }

  if (entry.type === 'anthropic') {
    return anthropicProvider({
      apiKey,
      model,
    });
  }

  return null;
}

export function getApiKey(provider: ProviderEntry): string | undefined {
  if (provider.apiKeyEnv === 'EXPO_PUBLIC_GROQ_API_KEY') {
    return process.env.EXPO_PUBLIC_GROQ_API_KEY;
  }
  if (provider.apiKeyEnv === 'EXPO_PUBLIC_ANTHROPIC_API_KEY') {
    return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  }

  return undefined;
}
