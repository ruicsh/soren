import { renderHook, waitFor } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';

import { initVectorStore } from '@/lib/vector-store';

import { useVectorStore } from './use-vector-store';

vi.mock('@/lib/vector-store', async () => {
  const actual = await vi.importActual('@/lib/vector-store');

  return {
    ...(actual as any),
    initVectorStore: vi.fn(),
  };
});

describe('useVectorStore', () => {
  it('initializes and transitions to ready', async () => {
    vi.mocked(initVectorStore).mockResolvedValue({
      error: null,
      status: 'ready',
    });

    const { result } = renderHook(() => useVectorStore());

    expect(result.current.status).toBe('initializing');

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current.error).toBeNull();
  });

  it('handles initialization error', async () => {
    const error = new Error('DB corrupted');
    vi.mocked(initVectorStore).mockResolvedValue({ error, status: 'error' });

    const { result } = renderHook(() => useVectorStore());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);
  });
});
