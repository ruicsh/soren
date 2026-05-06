import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ChatMessage } from '@/lib/llm/types';

import { createProvider } from '@/lib/llm/catalog';
import { createStreamChat } from '@/lib/llm/xhr-stream';

const BATCH_MS = 50;

export interface UseChatStreamOptions {
  /** Fired with each flushed batch of streaming text */
  onStreamingChunk?: (chunk: string) => void;
  providerId?: string;
  providerModel?: string;
}

export function useChatStream(options?: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);
  const pendingRef = useRef('');
  const flushTimerRef = useRef<null | ReturnType<typeof setInterval>>(null);
  const isStreamingRef = useRef(false);
  const onStreamingChunkRef = useRef(options?.onStreamingChunk);
  onStreamingChunkRef.current = options?.onStreamingChunk;

  const { providerId, providerModel } = options || {};

  const provider = useMemo(() => {
    if (!providerId || !providerModel) return null;

    return createProvider(providerId, providerModel);
  }, [providerId, providerModel]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const flush = useCallback(() => {
    const delta = pendingRef.current;
    if (!delta) return;
    pendingRef.current = '';
    onStreamingChunkRef.current?.(delta);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;

      return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
    });
  }, []);

  useEffect(() => {
    provider?.warmup?.();
  }, [provider]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreamingRef.current) return;

      if (!provider) {
        const errorMsg = 'LLM Provider not configured.';
        setMessages((prev) => [
          ...prev,
          { content: text.trim(), id: generateId(), role: 'user' },
          { content: errorMsg, id: generateId(), role: 'assistant' },
        ]);

        return;
      }

      abortRef.current = false;
      pendingRef.current = '';

      const userMessage: ChatMessage = {
        content: text.trim(),
        id: generateId(),
        role: 'user',
      };

      const assistantMessage: ChatMessage = {
        content: '',
        id: generateId(),
        role: 'assistant',
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      flushTimerRef.current = setInterval(flush, BATCH_MS);

      try {
        const history = [...messages, userMessage].map((m) => ({
          content: m.content,
          role: m.role as 'assistant' | 'system' | 'user',
        }));

        const historyWithSystem = [
          {
            content:
              'You are a helpful, concise assistant. Keep responses brief.',
            role: 'system' as const,
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
    [messages, flush, provider],
  );

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { isStreaming, messages, sendMessage, stop };
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
