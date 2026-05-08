import { open } from '@op-engineering/op-sqlite';
import { describe, expect, it, vi } from 'vitest';

import { getVectorStore, initVectorStore } from './vector-store';

describe('vector-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Reset singleton state manually if needed, or rely on module reload if possible.
    // Since we can't easily reset module state, we'll test the behavior.
    const store = getVectorStore();
    store.close();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes successfully when sqlite-vec is present', async () => {
    const mockDb = {
      executeSync: vi.fn((sql) => {
        if (sql.includes('vec_version')) {
          return { rows: [{ version: 'v0.1.0' }] };
        }

        return { rows: [] };
      }),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const result = await initVectorStore();

    expect(result.status).toBe('ready');
    expect(result.error).toBeNull();
    expect(mockDb.executeSync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE VIRTUAL TABLE'),
    );
  });

  it('fails to initialize when sqlite-vec is missing', async () => {
    const mockDb = {
      close: vi.fn(),
      executeSync: vi.fn(() => ({ rows: [] })),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const result = await initVectorStore();

    expect(result.status).toBe('error');
    expect(result.error?.message).toContain('sqlite-vec extension not loaded');
    expect(mockDb.close).toHaveBeenCalled();
  });

  it('inserts and searches embeddings when ready', async () => {
    const mockDb = {
      executeSync: vi.fn((sql) => {
        if (sql.includes('vec_version')) {
          return { rows: [{ version: 'v0.1.0' }] };
        }
        if (sql.includes('INSERT')) {
          return { insertId: 1 };
        }
        if (sql.includes('SELECT')) {
          return { rows: [{ distance: 0.1, metadata: 'test', rowid: 1 }] };
        }

        return { rows: [] };
      }),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    await initVectorStore();
    const store = getVectorStore();

    const embedding = new Float32Array(384).fill(0.1);
    const rowid = store.insertEmbedding(embedding, 'test');
    expect(rowid).toBe(1);

    const results = store.searchSimilar(embedding);
    expect(results).toHaveLength(1);
    expect(results[0].metadata).toBe('test');
  });

  it('throws when inserting with wrong dimension', async () => {
    const mockDb = {
      executeSync: vi.fn(() => ({ rows: [{ version: 'v0.1.0' }] })),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    await initVectorStore();
    const store = getVectorStore();

    const smallEmbedding = new Float32Array(10).fill(0.1);
    expect(() => store.insertEmbedding(smallEmbedding, 'test')).toThrow(
      /dimension/,
    );
  });
});
