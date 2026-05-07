export interface ChatMessage {
  content: string;
  id: string;
  role: 'assistant' | 'system' | 'user';
  timestamp?: number;
}

export interface LLMProvider {
  buildRequest(
    messages: { content: string; role: 'assistant' | 'system' | 'user' }[],
  ): {
    body: string;
    headers: Record<string, string>;
    url: string;
  };
  isDone(lines: string[]): boolean;
  parseChunk(lines: string[]): string[];
  streamFormat?: 'ndjson' | 'sse';
  warmup?(): void;
}

export interface StreamMetrics {
  firstTokenTime: null | number;
  headersTime: null | number;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public isTransient: boolean = false,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
