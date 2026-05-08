import { type DB, open } from '@op-engineering/op-sqlite';

export interface VectorSearchResult {
  distance: number;
  metadata: string;
  rowid: number;
}

export interface VectorStore {
  close: () => void;
  deleteEmbedding: (rowid: number) => void;
  insertEmbedding: (embedding: Float32Array, metadata: string) => number;
  isReady: boolean;
  searchSimilar: (
    queryEmbedding: Float32Array,
    k?: number,
  ) => VectorSearchResult[];
  status: VectorStoreStatus;
}

export type VectorStoreStatus = 'error' | 'initializing' | 'ready';

const DB_NAME = 'soren_vectors.db';
const EMBEDDING_DIM = 384;
const DEBUG = process.env.EXPO_PUBLIC_DEBUG_SQLITE === '1';

let db: DB | null = null;
let storeStatus: VectorStoreStatus = 'initializing';
let initPromise: null | Promise<{
  error: Error | null;
  status: VectorStoreStatus;
}> = null;

export function getVectorStore(): VectorStore {
  return {
    close: () => {
      if (db) {
        if (DEBUG) console.log('[SQLite] Closing database...');
        try {
          db.close();
        } catch (err) {
          if (DEBUG) console.warn('[SQLite] Close failed:', err);
        }
        db = null;
        storeStatus = 'initializing';
        initPromise = null;
      }
    },
    deleteEmbedding: (rowid: number) => {
      if (!db || storeStatus !== 'ready') return;

      if (DEBUG) console.log(`[SQLite] Deleting embedding rowid=${rowid}`);
      db.executeSync('DELETE FROM vec_embeddings WHERE rowid = ?', [rowid]);
    },
    insertEmbedding: (embedding: Float32Array, metadata: string) => {
      if (!db || storeStatus !== 'ready') {
        throw new Error('Vector store not ready');
      }

      if (embedding.length !== EMBEDDING_DIM) {
        throw new Error(
          `Invalid embedding dimension: expected ${EMBEDDING_DIM}, got ${embedding.length}`,
        );
      }

      if (DEBUG)
        console.log(
          `[SQLite] Inserting embedding (dim=${embedding.length}, metadata_len=${metadata.length})`,
        );
      const result = db.executeSync(
        'INSERT INTO vec_embeddings(embedding, metadata) VALUES (?, ?)',
        [embedding, metadata],
      );

      return result.insertId!;
    },
    get isReady() {
      return db !== null && storeStatus === 'ready';
    },
    searchSimilar: (queryEmbedding: Float32Array, k = 10) => {
      if (!db || storeStatus !== 'ready') return [];

      if (queryEmbedding.length !== EMBEDDING_DIM) {
        throw new Error(
          `Invalid query dimension: expected ${EMBEDDING_DIM}, got ${queryEmbedding.length}`,
        );
      }

      if (DEBUG)
        console.log(`[SQLite] Searching for k=${k} similar embeddings`);
      const result = db.executeSync(
        'SELECT rowid, distance, metadata FROM vec_embeddings WHERE embedding MATCH ? AND k = ?',
        [queryEmbedding, k],
      );

      const rows = (result.rows as unknown as VectorSearchResult[]) || [];
      if (DEBUG) console.log(`[SQLite] Found ${rows.length} results`);

      return rows;
    },
    get status() {
      return storeStatus;
    },
  };
}

export async function initVectorStore(): Promise<{
  error: Error | null;
  status: VectorStoreStatus;
}> {
  if (db && storeStatus === 'ready') {
    return { error: null, status: 'ready' };
  }

  if (initPromise) {
    if (DEBUG) console.log('[SQLite] Initialization already in progress...');

    return initPromise;
  }

  if (DEBUG) console.log('[SQLite] Initializing vector store...');
  storeStatus = 'initializing';

  initPromise = (async (): Promise<{
    error: Error | null;
    status: VectorStoreStatus;
  }> => {
    try {
      if (DEBUG) console.log(`[SQLite] Opening database: ${DB_NAME}`);
      db = open({ name: DB_NAME });

      // Verify sqlite-vec is available
      const versionResult = db.executeSync('SELECT vec_version() as version');
      const version = versionResult.rows?.[0]?.version;
      if (!version) {
        throw new Error('sqlite-vec extension not loaded or missing');
      }
      if (DEBUG) console.log(`[SQLite] sqlite-vec version: ${version}`);

      // Create virtual table for embeddings
      // +metadata makes it an auxiliary column (stored but not indexed for KNN)
      if (DEBUG) console.log('[SQLite] Ensuring vec_embeddings table exists');
      db.executeSync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_embeddings USING vec0(
          embedding float[${EMBEDDING_DIM}],
          +metadata text
        )
      `);

      storeStatus = 'ready';
      if (DEBUG) console.log('[SQLite] Vector store ready');

      return { error: null, status: 'ready' };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[SQLite] Initialization failed:', error);

      if (db) {
        try {
          db.close();
        } catch {
          // Ignore close error
        }
        db = null;
      }

      storeStatus = 'error';

      return { error, status: 'error' };
    }
  })();

  const result = await initPromise;

  // Reset promise guard so close + re-init works
  initPromise = null;

  return result;
}
