export const STYLE_SYSTEM_PROMPT =
  'We are chatting in text mode. Do not use any formatting like markdown, bold, italics, or tables. All responses must be conversational and plain text only.';

export const MEMORY_INSTRUCTION =
  'Below is relevant context from your previous conversations with the user. Use it if helpful to maintain continuity. If it is not relevant, ignore it.';

export interface BuildSystemPromptOptions {
  memories?: string[];
  systemPrompt?: string;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
  const { memories, systemPrompt } = options;

  const parts = [STYLE_SYSTEM_PROMPT];

  if (systemPrompt) {
    parts.push(systemPrompt);
  }

  if (memories && memories.length > 0) {
    parts.push(`${MEMORY_INSTRUCTION}\n\n${memories.join('\n\n')}`);
  }

  return parts.join('\n\n');
}
