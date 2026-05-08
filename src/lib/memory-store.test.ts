import { open } from '@op-engineering/op-sqlite';
import { Directory } from 'expo-file-system';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openMemoryStore } from './memory-store';

describe('memory-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes successfully with sqlite-vec', async () => {
    const mockDb = {
      close: vi.fn(),
      executeSync: vi.fn((sql) => {
        if (sql.includes('vec_version')) {
          return { rows: [{ version: 'v0.1.0' }] };
        }

        return { rows: [] };
      }),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const store = await openMemoryStore('test-uuid');

    expect(store.status).toBe('ready');
    expect(store.isReady).toBe(true);
    expect(mockDb.executeSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'CREATE VIRTUAL TABLE IF NOT EXISTS vec_interactions',
      ),
    );
    expect(Directory).toHaveBeenCalledWith(
      expect.stringContaining('chatbots/test-uuid/'),
    );
  });

  it('inserts interaction with correct metadata', async () => {
    const mockDb = {
      close: vi.fn(),
      executeSync: vi.fn((sql) => {
        if (sql.includes('vec_version')) {
          return { rows: [{ version: 'v0.1.0' }] };
        }
        if (sql.includes('INSERT')) {
          return { insertId: 42 };
        }

        return { rows: [] };
      }),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const store = await openMemoryStore('test-uuid');
    const embedding = new Float32Array(384).fill(0.5);

    const rowid = store.insertInteraction('20240508', '12:00:00', embedding);

    expect(rowid).toBe(42);
    expect(mockDb.executeSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO vec_interactions'),
      [embedding, expect.stringContaining('"dateKey":"20240508"')],
    );

    const metadataStr = (
      mockDb.executeSync.mock.calls.find((c) => c[0].includes('INSERT')) as any
    )[1][1];
    const metadata = JSON.parse(metadataStr);
    expect(metadata).toEqual({
      dateKey: '20240508',
      timeKey: '12:00:00',
    });
  });

  it('closes database and resets status', async () => {
    const mockDb = {
      close: vi.fn(),
      executeSync: vi.fn(() => ({ rows: [{ version: 'v0.1.0' }] })),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const store = await openMemoryStore('test-uuid');
    store.close();

    expect(mockDb.close).toHaveBeenCalled();
    expect(store.status).toBe('closed');
    expect(store.isReady).toBe(false);
  });

  it('searches interactions and parses results', async () => {
    const mockDb = {
      close: vi.fn(),
      executeSync: vi.fn((sql) => {
        if (sql.includes('vec_version')) {
          return { rows: [{ version: 'v0.1.0' }] };
        }
        if (sql.includes('SELECT')) {
          return {
            rows: [
              {
                distance: 0.1,
                metadata: JSON.stringify({
                  dateKey: '20240508',
                  timeKey: '12:00:00',
                }),
              },
            ],
          };
        }

        return { rows: [] };
      }),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const store = await openMemoryStore('test-uuid');
    const embedding = new Float32Array(384).fill(0.1);
    const results = await store.search(embedding, 3);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      dateKey: '20240508',
      distance: 0.1,
      timeKey: '12:00:00',
    });
    expect(mockDb.executeSync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [embedding, 3],
    );
  });

  it('fails when sqlite-vec is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockDb = {
      close: vi.fn(),
      executeSync: vi.fn(() => ({ rows: [] })),
    };
    vi.mocked(open).mockReturnValue(mockDb as any);

    const store = await openMemoryStore('test-uuid');

    expect(store.status).toBe('error');
    expect(mockDb.close).toHaveBeenCalled();
  });
});
