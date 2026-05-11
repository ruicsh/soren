import { act, renderHook, waitFor } from '@testing-library/react-native';
import { initExecutorch, useTextEmbeddings } from 'react-native-executorch';
import { vi } from 'vitest';

import { useExecutorch } from './use-executorch';

/**
 * Build a mock model object with defaults that would pass the health check.
 * Each test can override specific fields to simulate different scenarios.
 */
function makeModel(overrides: Record<string, unknown> = {}) {
  return {
    downloadProgress: 1,
    error: null,
    forward: vi.fn(() => Promise.resolve(new Float32Array(384).fill(0.1))),
    isGenerating: false,
    isReady: true,
    ...overrides,
  };
}

describe('useExecutorch', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset mocks to their default (passing) state before each test
    vi.mocked(initExecutorch).mockResolvedValue(undefined as never);
    vi.mocked(useTextEmbeddings).mockReturnValue(makeModel());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Happy path ───────────────────────────────────────────────

  it('initializes and transitions through statuses', async () => {
    const { result } = renderHook(() => useExecutorch());

    expect(result.current.status).toBe('initializing');
    expect(initExecutorch).toHaveBeenCalled();

    // After init resolves the status moves to 'downloading', then
    // after a successful health check it settles on 'ready'.
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current.embed).toBeDefined();
    const embedding = await result.current.embed('test');
    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embedding.length).toBe(384);
    expect(result.current.downloadProgress).toBe(1);
    expect(result.current.error).toBeNull();
  });

  // ─── Init failure ─────────────────────────────────────────────

  it('handles initialization error', async () => {
    const error = new Error('Init crash');
    vi.mocked(initExecutorch).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);
  });

  it('wraps non-Error init rejection in an Error object', async () => {
    vi.mocked(initExecutorch).mockRejectedValueOnce('string reason');

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string reason');
  });

  // ─── Model-level error ────────────────────────────────────────

  it('handles model-level error', async () => {
    const error = new Error('Model corruption');
    vi.mocked(useTextEmbeddings).mockReturnValue(
      makeModel({ error, isReady: false }),
    );

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);
  });

  // ─── embed() guard ───────────────────────────────────────────

  it('throws when embed() called before model is ready', async () => {
    const { result } = renderHook(() => useExecutorch());

    await expect(result.current.embed('test')).rejects.toThrow(
      /model not ready/i,
    );
  });

  // ─── Health check — retry on "currently generating" ──────────

  it('retries health check on "currently generating" error and succeeds', async () => {
    const forward = vi
      .fn()
      .mockRejectedValueOnce(new Error('model is currently generating'))
      .mockResolvedValueOnce(new Float32Array(384).fill(0.1));

    vi.mocked(useTextEmbeddings).mockReturnValue(makeModel({ forward }));

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    // forward should have been called twice: first fail, second success
    expect(forward).toHaveBeenCalledTimes(2);
    expect(forward).toHaveBeenCalledWith('health check');
  });

  it('exhausts all health check retries and transitions to error', async () => {
    const forward = vi
      .fn()
      .mockRejectedValue(new Error('model is currently generating'));

    vi.mocked(useTextEmbeddings).mockReturnValue(makeModel({ forward }));

    const { result } = renderHook(() => useExecutorch());

    // Retries wait 2 × 500ms, so give waitFor a generous timeout
    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      { timeout: 5000 },
    );

    // Called 3 times (initial attempt + 2 retries), all failed
    expect(forward).toHaveBeenCalledTimes(3);
  });

  // ─── Health check — invalid embedding format ─────────────────

  it('fails health check when forward returns wrong-length array', async () => {
    const forward = vi.fn(() =>
      Promise.resolve(new Float32Array(128).fill(0.1)),
    );
    vi.mocked(useTextEmbeddings).mockReturnValue(makeModel({ forward }));

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('fails health check when forward returns non-Float32Array', async () => {
    const forward = vi.fn(() => Promise.resolve([0.1, 0.2, 0.3]));
    vi.mocked(useTextEmbeddings).mockReturnValue(makeModel({ forward }));

    const { result } = renderHook(() => useExecutorch());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  // ─── Health check — skipped when model not ready ────────────

  it('skips health check when model.isReady is false', async () => {
    vi.mocked(useTextEmbeddings).mockReturnValue(makeModel({ isReady: false }));

    const { result } = renderHook(() => useExecutorch());

    // Init succeeds → status becomes 'downloading'
    await waitFor(() => {
      expect(result.current.status).toBe('downloading');
    });

    // Health check never ran because isReady is false, so status
    // stays at 'downloading' indefinitely (no error either).
    // Wait a short moment to confirm no transition to 'ready' occurs.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.status).toBe('downloading');
    expect(result.current.error).toBeNull();
  });

  // ─── Error return logic ──────────────────────────────────────

  it('reports model.downloadProgress', async () => {
    vi.mocked(useTextEmbeddings).mockReturnValue(
      makeModel({ downloadProgress: 0.42 }),
    );

    const { result } = renderHook(() => useExecutorch());

    expect(result.current.downloadProgress).toBe(0.42);
  });
});
