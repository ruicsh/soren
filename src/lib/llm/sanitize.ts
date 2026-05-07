/**
 * Strips hidden reasoning/thought tags and their contents from a string.
 * Handles <thought>, <think>, <reasoning>, and <analysis> tags.
 * Also handles partial/dangling open tags at the start of a string (common in streams).
 */
export function sanitizeAssistantContent(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // 1. Remove complete blocks: <tag>...</tag>
  // Standard non-greedy match <tag>.*?</tag> fails on nested SAME tags
  // because it matches the first closing tag.
  // We use a loop and replace until no more tags are found.
  let prev;
  do {
    prev = sanitized;
    // We try to find any pair of tag-opentag-content-closetag
    sanitized = sanitized.replace(
      /<(thought|think|reasoning|analysis)>[^<]*?<\/\1>/gi,
      '',
    );
    // If that didn't work, maybe there are nested tags.
    // This isn't perfect for all HTML, but for these specific LLM tags it's usually enough.
    if (sanitized === prev) {
      sanitized = sanitized.replace(
        /<(thought|think|reasoning|analysis)>[\s\S]*?<\/\1>/gi,
        '',
      );
    }
  } while (sanitized !== prev);

  // 2. Remove dangling open tags: <tag>... (until end of string)
  sanitized = sanitized.replace(
    /<(thought|think|reasoning|analysis)>[\s\S]*$/gi,
    '',
  );

  // 3. Remove dangling close tags
  sanitized = sanitized.replace(/<\/(thought|think|reasoning|analysis)>/gi, '');

  return sanitized.trim();
}
