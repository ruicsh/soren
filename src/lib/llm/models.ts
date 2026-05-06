import { getApiKey, PROVIDERS } from './catalog';

export interface LLMModel {
  id: string;
  name: string;
}

const modelCache: Record<string, LLMModel[]> = {};

export function clearModelCache() {
  for (const key in modelCache) delete modelCache[key];
}

export async function fetchModels(providerId: string): Promise<LLMModel[]> {
  const entry = PROVIDERS.find((p) => p.id === providerId);
  if (!entry) return [];

  if (modelCache[providerId]) return modelCache[providerId];

  const apiKey = getApiKey(entry);
  if (!apiKey) {
    throw new Error(`Missing API Key: ${entry.apiKeyEnv}`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (entry.type === 'openai-compat') {
    headers.Authorization = `Bearer ${apiKey}`;
  } else if (entry.type === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  const resp = await fetch(entry.modelsUrl, { headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to fetch models: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  let rawModels: any[] = [];

  if (entry.type === 'openai-compat') {
    rawModels = data.data || [];
  } else if (entry.type === 'anthropic') {
    rawModels = data.data || [];
  }

  const models = rawModels
    .map((m: any) => ({
      id: m.id,
      name: m.id, // Some providers don't give a friendly name
    }))
    .filter(isChatModel);

  // Sort by ID
  models.sort((a, b) => a.id.localeCompare(b.id));

  if (models.length > 0) {
    modelCache[providerId] = models;
  }

  return models.length > 0
    ? models
    : rawModels.map((m: any) => ({ id: m.id, name: m.id }));
}

function isChatModel(model: LLMModel): boolean {
  const id = model.id.toLowerCase();

  const include = [
    'chat',
    'instruct',
    'sonnet',
    'opus',
    'haiku',
    'llama',
    'claude',
    'mixtral',
    'gemma',
    'qwen',
  ];
  const exclude = [
    'embed',
    'embedding',
    'moderation',
    'whisper',
    'tts',
    'transcribe',
    'vision',
    'image',
    'audio',
    'rerank',
  ];

  const hasInclude = include.some((term) => id.includes(term));
  const hasExclude = exclude.some((term) => id.includes(term));

  return hasInclude && !hasExclude;
}
