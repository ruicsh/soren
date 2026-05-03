import { useCallback, useEffect, useRef, useState } from 'react';

import { openaiCompatProvider } from '@/lib/llm/openai-compat';
import { createStreamChat } from '@/lib/llm/xhr-stream';
import type { ChatMessage } from '@/lib/llm/types';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'llama-3.1-8b-instant';

const provider = openaiCompatProvider({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  model: MODEL,
});

const BATCH_MS = 50;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);
  const pendingRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(() => {
    const delta = pendingRef.current;
    if (!delta) return;
    pendingRef.current = '';
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
    });
  }, []);

  useEffect(() => {
    provider.warmup?.();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      abortRef.current = false;
      pendingRef.current = '';

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
      };

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      flushTimerRef.current = setInterval(flush, BATCH_MS);

      try {
        const history = [...messages, userMessage].map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const historyWithSystem = [
          {
            role: 'system' as const,
            content:
              'You are a helpful, concise assistant. Keep responses brief.',
          },
          ...history,
        ];

        const stream = createStreamChat(
          provider,
          historyWithSystem,
          () => abortRef.current,
        );

        for await (const _delta of stream) {
          pendingRef.current += _delta;
        }
      } catch (err) {
        pendingRef.current =
          pendingRef.current ||
          (err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (flushTimerRef.current) {
          clearInterval(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        flush();
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, flush],
  );

  const stop = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { messages, isStreaming, sendMessage, stop };
}
