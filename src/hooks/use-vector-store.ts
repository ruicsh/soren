import { useCallback, useEffect, useState } from 'react';

import {
  getVectorStore,
  initVectorStore,
  type VectorSearchResult,
  type VectorStoreStatus,
} from '@/lib/vector-store';

export interface UseVectorStoreReturn {
  error: Error | null;
  insertEmbedding: (embedding: Float32Array, metadata: string) => null | number;
  searchSimilar: (
    queryEmbedding: Float32Array,
    k?: number,
  ) => VectorSearchResult[];
  status: VectorStoreStatus;
}

export function useVectorStore(): UseVectorStoreReturn {
  const [status, setStatus] = useState<VectorStoreStatus>('initializing');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const result = await initVectorStore();

      if (mounted) {
        setStatus(result.status);
        setError(result.error);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const insertEmbedding = useCallback(
    (embedding: Float32Array, metadata: string) => {
      if (status !== 'ready') return null;

      try {
        return getVectorStore().insertEmbedding(embedding, metadata);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));

        return null;
      }
    },
    [status],
  );

  const searchSimilar = useCallback(
    (queryEmbedding: Float32Array, k?: number) => {
      if (status !== 'ready') return [];

      try {
        return getVectorStore().searchSimilar(queryEmbedding, k);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));

        return [];
      }
    },
    [status],
  );

  return {
    error,
    insertEmbedding,
    searchSimilar,
    status,
  };
}
