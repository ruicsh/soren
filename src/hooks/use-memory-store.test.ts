import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openMemoryStore } from '@/lib/memory-store';

import { useMemoryStore } from './use-memory-store';

vi.mock('@/lib/memory-store', () => ({
  openMemoryStore: vi.fn(),
}));

describe('useMemoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes and closes store based on chatbotUuid', async () => {
    const mockStore = {
      close: vi.fn(),
      insertInteraction: vi.fn(),
      isReady: true,
      status: 'ready',
    };
    vi.mocked(openMemoryStore).mockResolvedValue(mockStore as any);

    const { rerender, unmount } = renderHook(
      ({ uuid }: { uuid: null | string }) => useMemoryStore(uuid),
      {
        initialProps: { uuid: 'uuid-1' as null | string },
      },
    );

    await waitFor(() => expect(openMemoryStore).toHaveBeenCalledWith('uuid-1'));

    rerender({ uuid: 'uuid-2' });

    await waitFor(() => expect(mockStore.close).toHaveBeenCalled());
    expect(openMemoryStore).toHaveBeenCalledWith('uuid-2');

    unmount();
    expect(mockStore.close).toHaveBeenCalledTimes(2);
  });

  it('provides insertInteraction when ready', async () => {
    const mockStore = {
      close: vi.fn(),
      insertInteraction: vi.fn(() => 123),
      isReady: true,
      status: 'ready',
    };
    vi.mocked(openMemoryStore).mockResolvedValue(mockStore as any);

    const { result } = renderHook(() => useMemoryStore('uuid-1'));

    await waitFor(() => expect(result.current.isReady).toBe(true));

    const rowid = result.current.insertInteraction!(
      '20240508',
      '12:00:00',
      new Float32Array(384),
    );
    expect(rowid).toBe(123);
    expect(mockStore.insertInteraction).toHaveBeenCalled();
  });

  it('returns closed status when uuid is null', () => {
    const { result } = renderHook(() => useMemoryStore(null));

    expect(result.current.status).toBe('closed');
    expect(result.current.insertInteraction).toBeNull();
    expect(openMemoryStore).not.toHaveBeenCalled();
  });
});
