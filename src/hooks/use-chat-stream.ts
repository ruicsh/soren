import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/lib/llm/types';

import { useExecutorchContext } from '@/context/ExecutorchContext';
import { useMemoryStore } from '@/hooks/use-memory-store';
import { getApiKey } from '@/lib/byok-keys';
import {
  DEFAULT_SYSTEM_PROMPT,
  loadLatestAvailableChatMessages,
  resolveMemoryText,
} from '@/lib/chatbot-config';
import { createProvider } from '@/lib/llm/catalog';
import { sanitizeAssistantContent } from '@/lib/llm/sanitize';
import { buildSystemPrompt } from '@/lib/llm/system-prompt';
import { LLMError } from '@/lib/llm/types';
import { createStreamChat } from '@/lib/llm/xhr-stream';

const BATCH_MS = 50;
/** Cosine distance threshold for memory recall. 0=identical, 0.5=moderate match. Results above this are discarded to avoid injecting irrelevant context. */
const MEMORY_MAX_DISTANCE = 0.5;

export interface UseChatStreamOptions {
  chatbotUuid?: string;
  lastConversationAt?: number;
  /** Fired with each flushed batch of streaming text */
  onStreamingChunk?: (chunk: string) => void;
  providerId?: string;
  providerModel?: string;
  systemPrompt?: string;
}

export function useChatStream(options?: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);
  const pendingRef = useRef('');
  const assistantRawRef = useRef('');
  const emittedSanitizedLenRef = useRef(0);
  const flushTimerRef = useRef<null | ReturnType<typeof setInterval>>(null);
  const isStreamingRef = useRef(false);
  const onStreamingChunkRef = useRef(options?.onStreamingChunk);
  onStreamingChunkRef.current = options?.onStreamingChunk;

  const {
    chatbotUuid,
    lastConversationAt,
    providerId,
    providerModel,
    systemPrompt,
  } = options || {};

  const { embed } = useExecutorchContext();
  const memoryStore = useMemoryStore(chatbotUuid || '');

  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    let active = true;
    if (!chatbotUuid) {
      setMessages([]);

      return;
    }

    loadLatestAvailableChatMessages(chatbotUuid, lastConversationAt).then(
      (history) => {
        if (!active) return;
        setMessages(history);
      },
    );

    return () => {
      active = false;
    };
  }, [chatbotUuid, lastConversationAt]);

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

    assistantRawRef.current += delta;
    const fullSanitized = sanitizeAssistantContent(assistantRawRef.current);
    const newSanitizedDelta = fullSanitized.slice(
      emittedSanitizedLenRef.current,
    );

    if (newSanitizedDelta) {
      onStreamingChunkRef.current?.(newSanitizedDelta);
      emittedSanitizedLenRef.current += newSanitizedDelta.length;
    }

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;

      return [...prev.slice(0, -1), { ...last, content: fullSanitized }];
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
      assistantRawRef.current = '';
      emittedSanitizedLenRef.current = 0;

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

      const MAX_RETRIES = 2;
      let attempt = 0;

      let embedding: Float32Array | null = null;
      if (memoryStore.isReady && memoryStore.search) {
        try {
          embedding = await embed(text.trim());
        } catch (err) {
          console.warn('[useChatStream] Embedding failed:', err);
        }
      }

      const runStream = async () => {
        try {
          let memories: string[] = [];

          if (memoryStore.isReady && memoryStore.search && embedding) {
            try {
              const results = await memoryStore.search(
                embedding,
                3,
                MEMORY_MAX_DISTANCE,
              );

              if (chatbotUuid) {
                memories = await resolveMemoryText(chatbotUuid, results);
              }
            } catch (err) {
              console.warn('[useChatStream] Memory search failed:', err);
            }
          }

          const history = [...messages, userMessage].map((m) => ({
            content: m.content,
            role: m.role as 'assistant' | 'system' | 'user',
          }));

          const historyWithSystem = [
            {
              content: buildSystemPrompt({
                memories,
                systemPrompt: systemPrompt || DEFAULT_SYSTEM_PROMPT,
              }),
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
          if (
            err instanceof LLMError &&
            err.isTransient &&
            attempt < MAX_RETRIES &&
            !abortRef.current
          ) {
            attempt++;
            const delay = Math.pow(2, attempt) * 500 + Math.random() * 500;
            // Show temporary retry status in UI if we haven't received content yet
            if (assistantRawRef.current === '') {
              pendingRef.current = `(Retry ${attempt}/${MAX_RETRIES}: ${err.message}) `;
              flush();
              pendingRef.current = '';
            }
            await new Promise((resolve) => setTimeout(resolve, delay));

            return runStream();
          }

          pendingRef.current =
            pendingRef.current ||
            (err instanceof Error ? err.message : 'Something went wrong');
        }
      };

      flushTimerRef.current = setInterval(flush, BATCH_MS);

      try {
        await runStream();

        // Drain any pending stream content before building memory embedding
        flush();

        // After stream success, compute a combined embedding from the
        // full user+assistant exchange (matching resolveMemoryText format)
        // so the vector index captures the full interaction, not just the query.
        const sanitizedAssistant = sanitizeAssistantContent(
          assistantRawRef.current,
        );
        let memoryEmbedding: Float32Array | null = null;

        if (sanitizedAssistant.trim()) {
          const resolvedText = `User: ${text.trim()}\nAssistant: ${sanitizedAssistant}`;
          const cappedText =
            resolvedText.length > 2000
              ? resolvedText.slice(0, 2000) + '...'
              : resolvedText;

          try {
            memoryEmbedding = await embed(cappedText);
          } catch (err) {
            console.warn('[useChatStream] Memory embedding failed:', err);
          }
        }

        if (memoryEmbedding && memoryStore.insertInteraction) {
          const date = new Date(now);
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          const dateKey = `${y}${m}${d}`;
          const timeKey = date.toTimeString().split(' ')[0];
          memoryStore.insertInteraction(dateKey, timeKey, memoryEmbedding);
        }
      } finally {
        if (flushTimerRef.current) {
          clearInterval(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        flush();
        setIsStreaming(false);
      }
    },
    [
      messages,
      flush,
      provider,
      chatbotUuid,
      providerId,
      systemPrompt,
      embed,
      memoryStore,
    ],
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
