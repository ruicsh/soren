export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamMetrics {
  headersTime: number | null;
  firstTokenTime: number | null;
}

export interface LLMProvider {
  buildRequest(messages: { role: string; content: string }[]): {
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  parseChunk(lines: string[]): string[];
  isDone(lines: string[]): boolean;
  warmup?(): void;
}
