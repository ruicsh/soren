import type { LLMProvider } from './types';

interface OllamaConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function ollamaProvider(config: OllamaConfig): LLMProvider {
  return {
    buildRequest(messages) {
      return {
        body: JSON.stringify({
          messages,
          model: config.model,
          stream: true,
        }),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        url: `${config.baseUrl}/chat`,
      };
    },

    isDone(lines) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.done === true) {
            return true;
          }
        } catch {
          // ignore malformed JSON
        }
      }

      return false;
    },

    parseChunk(lines) {
      const deltas: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const content = parsed.message?.content;
          if (typeof content === 'string' && content.length > 0) {
            deltas.push(content);
          }
        } catch {
          // ignore malformed JSON
        }
      }

      return deltas;
    },

    streamFormat: 'ndjson',
  };
}
