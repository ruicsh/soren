import type { LLMProvider } from './types';

interface OpenAICompatConfig {
  apiKey: string;
  baseUrl: string;
  extraBody?: Record<string, unknown>;
  model: string;
}

export function openaiCompatProvider(config: OpenAICompatConfig): LLMProvider {
  return {
    buildRequest(messages) {
      return {
        body: JSON.stringify({
          ...config.extraBody,
          messages,
          model: config.model,
          stream: true,
        }),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        url: `${config.baseUrl}/chat/completions`,
      };
    },

    isDone(lines) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed.slice(6) === '[DONE]') {
          return true;
        }
      }

      return false;
    },

    parseChunk(lines) {
      const deltas: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content.length > 0) {
            deltas.push(content);
          }
        } catch {
          // ignore malformed JSON
        }
      }

      return deltas;
    },

    warmup() {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', `${config.baseUrl}/models`);
      xhr.setRequestHeader('Authorization', `Bearer ${config.apiKey}`);
      xhr.send();
    },
  };
}
