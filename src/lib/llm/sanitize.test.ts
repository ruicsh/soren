import { sanitizeAssistantContent } from './sanitize';

describe('sanitizeAssistantContent', () => {
  it('removes complete thought blocks', () => {
    const input = '<thought>I should say hello</thought>Hello!';
    expect(sanitizeAssistantContent(input)).toBe('Hello!');
  });

  it('removes complete think blocks', () => {
    const input = '<think>Thinking...</think>Hi';
    expect(sanitizeAssistantContent(input)).toBe('Hi');
  });

  it('removes dangling open thought tags', () => {
    const input = 'Hello!<thought>I am still thinking';
    expect(sanitizeAssistantContent(input)).toBe('Hello!');
  });

  it('removes dangling open think tags', () => {
    const input = '<think>Processing...';
    expect(sanitizeAssistantContent(input)).toBe('');
  });

  it('handles multiple blocks', () => {
    const input = '<thought>1</thought>Part 1<thought>2</thought>Part 2';
    expect(sanitizeAssistantContent(input)).toBe('Part 1Part 2');
  });

  it('preserves normal text with < character', () => {
    const input = 'If x < 5 then true';
    expect(sanitizeAssistantContent(input)).toBe('If x < 5 then true');
  });

  it('handles nested-like tags (flatly)', () => {
    const input = '<thought><thought>double</thought>triple</thought>outside';
    expect(sanitizeAssistantContent(input)).toBe('outside');
  });

  it('removes reasoning and analysis tags', () => {
    const input = '<reasoning>why</reasoning><analysis>what</analysis>result';
    expect(sanitizeAssistantContent(input)).toBe('result');
  });
});
