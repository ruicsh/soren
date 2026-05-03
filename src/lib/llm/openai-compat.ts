import type { LLMProvider } from './types';

interface OpenAICompatConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  extraBody?: Record<string, unknown>;
}

export function openaiCompatProvider(config: OpenAICompatConfig): LLMProvider {
  return {
    buildRequest(messages) {
      return {
        url: `${config.baseUrl}/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: true,
          ...config.extraBody,
        }),
      };
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

    isDone(lines) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed.slice(6) === '[DONE]') {
          return true;
        }
      }
      return false;
    },

    warmup() {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', `${config.baseUrl}/models`);
      xhr.setRequestHeader('Authorization', `Bearer ${config.apiKey}`);
      xhr.send();
    },
  };
}
