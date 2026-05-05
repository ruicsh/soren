import type { LLMProvider } from './types';

interface AnthropicConfig {
  apiKey: string;
  maxTokens?: number;
  model: string;
}

export function anthropicProvider(config: AnthropicConfig): LLMProvider {
  const maxTokens = config.maxTokens ?? 4096;

  return {
    buildRequest(messages) {
      // Anthropic requires system as a top-level param, not in messages
      const systemMessage = messages.find((m) => m.role === 'system');
      const chatMessages = messages.filter((m) => m.role !== 'system');

      return {
        body: JSON.stringify({
          max_tokens: maxTokens,
          model: config.model,
          ...(systemMessage ? { system: systemMessage.content } : {}),
          messages: chatMessages,
          stream: true,
        }),
        headers: {
          'anthropic-version': '2024-01-01',
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        url: 'https://api.anthropic.com/v1/messages',
      };
    },

    isDone(lines) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'event: message_stop') return true;
      }
      return false;
    },

    parseChunk(lines) {
      let eventType = '';
      const deltas: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event: ')) {
          eventType = trimmed.slice(7);
          continue;
        }
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (eventType === 'content_block_delta') {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.delta?.text;
            if (typeof text === 'string' && text.length > 0) {
              deltas.push(text);
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
      return deltas;
    },

    warmup() {
      // Anthropic doesn't have a lightweight models endpoint,
      // so we send a minimal non-streaming request
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.anthropic.com/v1/messages');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('x-api-key', config.apiKey);
      xhr.setRequestHeader('anthropic-version', '2024-01-01');
      xhr.send(
        JSON.stringify({
          max_tokens: 1,
          messages: [{ content: 'hi', role: 'user' }],
          model: config.model,
        }),
      );
    },
  };
}
