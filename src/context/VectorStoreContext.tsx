import React, {
  createContext,
  type PropsWithChildren,
  useContext,
} from 'react';

import { useVectorStore } from '@/hooks/use-vector-store';
import {
  type VectorSearchResult,
  type VectorStoreStatus,
} from '@/lib/vector-store';

interface VectorStoreContextType {
  error: Error | null;
  insertEmbedding: (embedding: Float32Array, metadata: string) => null | number;
  searchSimilar: (
    queryEmbedding: Float32Array,
    k?: number,
  ) => VectorSearchResult[];
  status: VectorStoreStatus;
}

const VectorStoreContext = createContext<null | VectorStoreContextType>(null);

export function useVectorStoreContext() {
  const context = useContext(VectorStoreContext);
  if (!context) {
    throw new Error(
      'useVectorStoreContext must be used within a VectorStoreProvider',
    );
  }

  return context;
}

export function VectorStoreProvider(props: PropsWithChildren) {
  const { children } = props;
  const vectorStore = useVectorStore();

  return (
    <VectorStoreContext.Provider value={vectorStore}>
      {children}
    </VectorStoreContext.Provider>
  );
}
