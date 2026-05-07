import { useCallback, useEffect, useRef } from 'react';

const SENTENCE_REGEX = /([.!?]+)(?:\s+|$)/g;
const MIN_SENTENCE_LENGTH = 1;
const MAX_CHUNK_LENGTH = 150;

export interface UseSentenceBufferOptions {
  onSentence: (sentence: string) => void;
}

export interface UseSentenceBufferReturn {
  /** Append streaming text; complete sentences or long chunks are emitted via onSentence */
  append: (text: string) => void;
  /** Flush any remaining text as a final sentence */
  flush: () => void;
  /** Clear buffer without emitting */
  reset: () => void;
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

    let lastIndex = 0;
    SENTENCE_REGEX.lastIndex = 0;

    let match: null | RegExpExecArray;
    while ((match = SENTENCE_REGEX.exec(bufferRef.current)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentence = bufferRef.current.slice(lastIndex, endIndex).trim();

      // Only emit if it's a decent length or we've reached a hard punctuation
      // This avoids emitting very short fragments like "Dr." or "St."
      if (sentence.length >= MIN_SENTENCE_LENGTH || match[1].length > 1) {
        onSentenceRef.current(sentence);
        lastIndex = endIndex;
        SENTENCE_REGEX.lastIndex = lastIndex; // Update search position
      }
    }

    // If buffer is getting too long without a sentence break, force a chunk
    if (bufferRef.current.length - lastIndex > MAX_CHUNK_LENGTH) {
      const chunk = bufferRef.current.slice(lastIndex).trim();
      if (chunk) {
        onSentenceRef.current(chunk);
      }
      bufferRef.current = '';
      lastIndex = 0;
    } else if (lastIndex > 0) {
      bufferRef.current = bufferRef.current.slice(lastIndex);
    }
  }, []);

  const flush = useCallback(() => {
    const remainder = bufferRef.current.trim();
    if (remainder) {
      onSentenceRef.current(remainder);
    }
    bufferRef.current = '';
  }, []);

  const reset = useCallback(() => {
    bufferRef.current = '';
  }, []);

  return { append, flush, reset };
}
