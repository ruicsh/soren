import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/lib/llm/types';

import { getApiKey } from '@/lib/byok-keys';
import { loadChatMessagesForDate } from '@/lib/chatbot-config';
import { createProvider } from '@/lib/llm/catalog';
import { createStreamChat } from '@/lib/llm/xhr-stream';

const BATCH_MS = 50;

export interface UseChatStreamOptions {
  chatbotUuid?: string;
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

  const { chatbotUuid, providerId, providerModel } = options || {};

  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    let active = true;
    if (!chatbotUuid) {
      setMessages([]);

      return;
    }

    loadChatMessagesForDate(chatbotUuid).then((history) => {
      if (!active) return;
      setMessages(history);
    });

    return () => {
      active = false;
    };
  }, [chatbotUuid]);

  useEffect(() => {
    let active = true;
    if (!providerId || !providerModel || !chatbotUuid) {
      setProvider(null);

      return;
    }

    getApiKey(chatbotUuid, providerId).then((key) => {
      if (!active) return;
      if (!key) {
        setProvider(null);

        return;
      }
      const p = createProvider(providerId, providerModel, key);
      setProvider(p);
    });

    return () => {
      active = false;
    };
  }, [providerId, providerModel, chatbotUuid]);

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
        const errorMsg =
          !chatbotUuid || !providerId
            ? 'LLM Provider not configured.'
            : 'API Key missing. Please go to Settings to add it.';

        setMessages((prev) => [
          ...prev,
          {
            content: text.trim(),
            id: generateId(),
            role: 'user',
            timestamp: Date.now(),
          },
          {
            content: errorMsg,
            id: generateId(),
            role: 'assistant',
            timestamp: Date.now(),
          },
        ]);

        return;
      }

      abortRef.current = false;
      pendingRef.current = '';

      const now = Date.now();
      const userMessage: ChatMessage = {
        content: text.trim(),
        id: generateId(),
        role: 'user',
        timestamp: now,
      };

      const assistantMessage: ChatMessage = {
        content: '',
        id: generateId(),
        role: 'assistant',
        timestamp: now,
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
    [messages, flush, provider, chatbotUuid, providerId],
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
