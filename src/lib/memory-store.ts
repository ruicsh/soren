import { type DB, open } from '@op-engineering/op-sqlite';
import { Directory, Paths } from 'expo-file-system';

export interface MemoryPointer {
  dateKey: string; // YYYYMMDD
  timeKey: string; // HH:mm:ss
}

export interface MemoryQueryResult extends MemoryPointer {
  distance: number;
}

export interface MemoryStore {
  clear: () => void;
  close: () => void;
  insertInteraction: (
    dateKey: string,
    timeKey: string,
    embedding: Float32Array,
  ) => number;
  isReady: boolean;
  search: (
    embedding: Float32Array,
    limit?: number,
  ) => Promise<MemoryQueryResult[]>;
  status: MemoryStoreStatus;
}

export type MemoryStoreStatus = 'closed' | 'error' | 'initializing' | 'ready';

const DB_NAME = 'memory.db';
const EMBEDDING_DIM = 384;
const DEBUG = process.env.EXPO_PUBLIC_DEBUG_SQLITE === '1';

export async function openMemoryStore(uuid: string): Promise<MemoryStore> {
  let db: DB | null = null;
  let storeStatus: MemoryStoreStatus = 'initializing';

  const getChatbotDirPath = (botUuid: string) => {
    // Paths.document.uri can be a file:// URI; op-sqlite expects a path
    const basePath = Paths.document.uri.replace(/^file:\/\//, '');

    return `${basePath}chatbots/${botUuid}/`;
  };

  const dirPath = getChatbotDirPath(uuid);

  try {
    if (DEBUG) console.log(`[Memory] Ensuring directory exists: ${dirPath}`);
    const dir = new Directory(dirPath);
    if (!dir.exists) {
      dir.create({ idempotent: true, intermediates: true });
    }

    if (DEBUG)
      console.log(`[Memory] Opening database: ${DB_NAME} at ${dirPath}`);
    db = open({ location: dirPath, name: DB_NAME });

    // Verify sqlite-vec
    const versionResult = db.executeSync('SELECT vec_version() as version');
    const version = versionResult.rows?.[0]?.version;
    if (!version) {
      throw new Error('sqlite-vec extension not loaded or missing');
    }
    if (DEBUG) console.log(`[Memory] sqlite-vec version: ${version}`);

    // Create virtual table
    if (DEBUG) console.log('[Memory] Ensuring vec_interactions table exists');
    db.executeSync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS vec_interactions USING vec0(
        embedding float[${EMBEDDING_DIM}],
        +metadata text
      )
    `);

    storeStatus = 'ready';

    const store: MemoryStore = {
      clear: () => {
        if (db && storeStatus === 'ready') {
          if (DEBUG) console.log('[Memory] Clearing database...');
          db.executeSync('DELETE FROM vec_interactions');
        }
      },
      close: () => {
        if (db) {
          if (DEBUG) console.log('[Memory] Closing database...');
          try {
            db.close();
          } catch (err) {
            if (DEBUG) console.warn('[Memory] Close failed:', err);
          }
          db = null;
          storeStatus = 'closed';
        }
      },
      insertInteraction: (
        dateKey: string,
        timeKey: string,
        embedding: Float32Array,
      ) => {
        if (!db || storeStatus === 'closed') {
          throw new Error('Memory store not ready');
        }

        if (embedding.length !== EMBEDDING_DIM) {
          throw new Error(
            `Invalid embedding dimension: expected ${EMBEDDING_DIM}, got ${embedding.length}`,
          );
        }

        const metadata: MemoryPointer = {
          dateKey,
          timeKey,
        };

        if (DEBUG)
          console.log(
            `[Memory] Inserting interaction (dateKey=${dateKey}, timeKey=${timeKey})`,
          );

        const result = db.executeSync(
          'INSERT INTO vec_interactions(embedding, metadata) VALUES (?, ?)',
          [embedding, JSON.stringify(metadata)],
        );

        return result.insertId!;
      },
      get isReady() {
        return db !== null && storeStatus === 'ready';
      },
      search: async (embedding: Float32Array, limit = 5) => {
        if (!db || storeStatus !== 'ready') {
          throw new Error('Memory store not ready');
        }

        if (embedding.length !== EMBEDDING_DIM) {
          throw new Error(
            `Invalid embedding dimension: expected ${EMBEDDING_DIM}, got ${embedding.length}`,
          );
        }

        if (DEBUG) console.log(`[Memory] Searching (limit=${limit})`);

        const result = db.executeSync(
          `
          SELECT
            metadata,
            distance
          FROM vec_interactions
          WHERE embedding MATCH ?
          ORDER BY distance
          LIMIT ?
        `,
          [embedding, limit],
        );

        const items: MemoryQueryResult[] = [];
        const rows = result.rows ?? [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]!;
          try {
            const meta = JSON.parse(row.metadata as string) as MemoryPointer;
            items.push({
              ...meta,
              distance: row.distance as number,
            });
          } catch (err) {
            if (DEBUG) console.warn('[Memory] Failed to parse metadata:', err);
          }
        }

        return items;
      },
      get status() {
        return storeStatus;
      },
    };

    return store;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[Memory] Initialization failed:', error);

    if (db) {
      try {
        db.close();
      } catch {
        // Ignore
      }
      db = null;
    }

    storeStatus = 'error';

    return {
      clear: () => {},
      close: () => {},
      insertInteraction: () => {
        throw new Error('Memory store in error state');
      },
      isReady: false,
      search: async () => {
        throw new Error('Memory store in error state');
      },
      status: 'error',
    };
  }
}
