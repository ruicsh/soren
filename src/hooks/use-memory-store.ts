import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type MemoryQueryResult,
  type MemoryStore,
  type MemoryStoreStatus,
  openMemoryStore,
} from '@/lib/memory-store';

export interface UseMemoryStoreReturn {
  clear: (() => void) | null;
  insertInteraction:
    | ((
        dateKey: string,
        timeKey: string,
        embedding: Float32Array,
      ) => null | number)
    | null;
  isReady: boolean;
  search:
    | ((
        embedding: Float32Array,
        limit?: number,
        maxDistance?: number,
      ) => Promise<MemoryQueryResult[]>)
    | null;
  status: MemoryStoreStatus;
}

export function useMemoryStore(
  chatbotUuid: null | string,
): UseMemoryStoreReturn {
  const [status, setStatus] = useState<MemoryStoreStatus>('closed');
  const storeRef = useRef<MemoryStore | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!chatbotUuid || chatbotUuid.trim() === '') {
        if (storeRef.current) {
          storeRef.current.close();
          storeRef.current = null;
        }
        setStatus('closed');

        return;
      }

      if (storeRef.current) {
        storeRef.current.close();
        storeRef.current = null;
      }

      setStatus('initializing');

      try {
        const store = await openMemoryStore(chatbotUuid);
        if (!mounted) {
          store.close();

          return;
        }
        storeRef.current = store;
        setStatus(store.status);
      } catch (err) {
        console.error('[Memory] Hook initialization failed:', err);
        if (mounted) setStatus('error');
      }
    }

    init();

    return () => {
      mounted = false;
      if (storeRef.current) {
        storeRef.current.close();
        storeRef.current = null;
      }
    };
  }, [chatbotUuid]);

  const insertInteraction = useCallback(
    (dateKey: string, timeKey: string, embedding: Float32Array) => {
      if (!storeRef.current || status !== 'ready') return null;

      try {
        return storeRef.current.insertInteraction(dateKey, timeKey, embedding);
      } catch (err) {
        console.warn('[Memory] Insert interaction failed:', err);

        return null;
      }
    },
    [status],
  );

  const search = useCallback(
    async (embedding: Float32Array, limit?: number, maxDistance?: number) => {
      if (!storeRef.current || status !== 'ready') return [];

      try {
        return await storeRef.current.search(embedding, limit, maxDistance);
      } catch (err) {
        console.warn('[Memory] Search failed:', err);

        return [];
      }
    },
    [status],
  );

  const clear = useCallback(() => {
    if (storeRef.current && status === 'ready') {
      storeRef.current.clear();
    }
  }, [status]);

  const value = useMemo(
    () => ({
      clear: status === 'ready' ? clear : null,
      insertInteraction: status === 'ready' ? insertInteraction : null,
      isReady: status === 'ready',
      search: status === 'ready' ? search : null,
      status,
    }),
    [status, clear, insertInteraction, search],
  );

  return value;
}
