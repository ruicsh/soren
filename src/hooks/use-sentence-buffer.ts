import { useCallback, useEffect, useRef } from 'react';

const SENTENCE_REGEX = /[.!?]+(?:\s+|$)/g;

export interface UseSentenceBufferOptions {
  onSentence: (sentence: string) => void;
}

export interface UseSentenceBufferReturn {
  /** Append streaming text; complete sentences are emitted via onSentence */
  append: (text: string) => void;
  /** Flush any remaining text as a final sentence */
  flush: () => void;
}

export function useSentenceBuffer(
  options: UseSentenceBufferOptions,
): UseSentenceBufferReturn {
  const bufferRef = useRef('');
  const onSentenceRef = useRef(options.onSentence);

  useEffect(() => {
    onSentenceRef.current = options.onSentence;
  }, [options.onSentence]);

  const append = useCallback((text: string) => {
    bufferRef.current += text;

    const sentences: string[] = [];
    let lastIndex = 0;
    let match: null | RegExpExecArray;

    SENTENCE_REGEX.lastIndex = 0;

    while ((match = SENTENCE_REGEX.exec(bufferRef.current)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentence = bufferRef.current.slice(lastIndex, endIndex).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = endIndex;
    }

    if (sentences.length > 0) {
      bufferRef.current = bufferRef.current.slice(lastIndex);
      sentences.forEach((s) => onSentenceRef.current(s));
    }
  }, []);

  const flush = useCallback(() => {
    const remainder = bufferRef.current.trim();
    if (remainder) {
      onSentenceRef.current(remainder);
    }
    bufferRef.current = '';
  }, []);

  return { append, flush };
}
