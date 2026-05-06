import type { LLMProvider } from './types';

import { anthropicProvider } from './anthropic';
import { openaiCompatProvider } from './openai-compat';

export interface ProviderEntry {
  baseUrl?: string;
  defaultModel: string;
  id: string;
  label: string;
  modelsUrl: string;
  type: 'anthropic' | 'openai-compat' | 'openai';
}

export const PROVIDERS: ProviderEntry[] = [
  {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    id: 'openai',
    label: 'OpenAI',
    modelsUrl: 'https://api.openai.com/v1/models',
    type: 'openai-compat',
  },
  {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    id: 'groq',
    label: 'Groq',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    type: 'openai-compat',
  },
  {
    baseUrl: 'https://opencode.ai/zen/go/v1',
    defaultModel: 'deepseek-v4-flash',
    id: 'opencode-go',
    label: 'OpenCode Go',
    modelsUrl: 'https://opencode.ai/zen/go/v1/models',
    type: 'openai-compat',
  },
  {
    defaultModel: 'claude-3-5-sonnet-20240620',
    id: 'anthropic',
    label: 'Anthropic',
    modelsUrl: 'https://api.anthropic.com/v1/models',
    type: 'anthropic',
  },
];

export function createProvider(
  id: string,
  model: string,
  apiKey: string,
): LLMProvider | null {
  const entry = PROVIDERS.find((p) => p.id === id);

  if (!entry || !apiKey) return null;

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
