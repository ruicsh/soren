export const STYLE_SYSTEM_PROMPT =
  'We are chatting in text mode. Do not use any formatting like markdown, bold, italics, or tables. All responses must be conversational and plain text only.';

export interface BuildSystemPromptOptions {
  systemPrompt?: string;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
  const { systemPrompt } = options;

  const parts = [STYLE_SYSTEM_PROMPT];

  if (systemPrompt) {
    parts.push(systemPrompt);
  }

  return parts.join('\n\n');
}
