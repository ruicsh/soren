import { act, renderHook, waitFor } from '@testing-library/react-native';
import { initExecutorch, useTextEmbeddings } from 'react-native-executorch';
import { vi } from 'vitest';

import { useExecutorch } from './use-executorch';

describe('useExecutorch', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes and transitions through statuses', async () => {
    vi.mocked(useTextEmbeddings).mockReturnValue({
      downloadProgress: 1,
      error: null,
      forward: vi.fn(() => Promise.resolve(new Float32Array(384).fill(0.1))),
      isGenerating: false,
      isReady: true,
    } as any);

    const { result } = renderHook(() => useExecutorch());

    // Initial state
    expect(result.current.status).toBe('initializing');
    expect(initExecutorch).toHaveBeenCalled();

    // After init resolves, status should be downloading OR ready
    // (In tests, the mock model might be ready immediately)
    await waitFor(() => {
      expect(['downloading', 'ready']).toContain(result.current.status);
    });

    // Finally should be ready
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current.embed).toBeDefined();
    const embedding = await result.current.embed('test');
    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embedding.length).toBe(384);
  });

  it('handles initialization error', async () => {
    const error = new Error('Init crash');
    vi.mocked(initExecutorch).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);
  });

  it('handles model-level error', async () => {
    const error = new Error('Model corruption');
    vi.mocked(useTextEmbeddings).mockReturnValue({
      downloadProgress: 0,
      error,
      forward: vi.fn(),
      isGenerating: false,
      isReady: false,
    } as any);

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);

    // Wait for any remaining effect-driven state updates to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it('throws when embed() called before ready', async () => {
    const { result } = renderHook(() => useExecutorch());

    await act(async () => {
      await expect(result.current.embed('test')).rejects.toThrow(
        /model not ready/i,
      );
    });
  });
});
