import { useCallback, useEffect, useState } from 'react';
import {
  ALL_MINILM_L6_V2,
  initExecutorch,
  useTextEmbeddings,
} from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

export type ExecutorchStatus =
  | 'downloading'
  | 'error'
  | 'initializing'
  | 'ready';

interface UseExecutorchReturn {
  downloadProgress: number;
  embed: (text: string) => Promise<Float32Array>;
  error: Error | null;
  status: ExecutorchStatus;
}

const DEBUG = process.env.EXPO_PUBLIC_DEBUG_EXECUTORCH === '1';

export function useExecutorch(): UseExecutorchReturn {
  const [status, setStatus] = useState<ExecutorchStatus>('initializing');
  const [initError, setInitError] = useState<Error | null>(null);
  const [healthCheckDone, setHealthCheckDone] = useState(false);

  // Initialize ExecuTorch once
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (DEBUG) console.log('[ExecuTorch] Initializing runtime...');
        await initExecutorch({ resourceFetcher: ExpoResourceFetcher });
        if (mounted) {
          if (DEBUG)
            console.log(
              '[ExecuTorch] Runtime initialized. Starting model download/load.',
            );
          setStatus('downloading');
        }
      } catch (err) {
        if (mounted) {
          console.error('[ExecuTorch] Initialization failed:', err);
          setInitError(err instanceof Error ? err : new Error(String(err)));
          setStatus('error');
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const model = useTextEmbeddings({ model: ALL_MINILM_L6_V2 });

  // Run health check when model is ready
  useEffect(() => {
    if (
      model.isReady &&
      !model.isGenerating &&
      status === 'downloading' &&
      !healthCheckDone
    ) {
      let mounted = true;

      async function healthCheck() {
        let attempts = 0;
        const maxAttempts = 3;

        if (DEBUG)
          console.log(
            '[ExecuTorch] Model isReady. Starting health check inference.',
          );

        while (attempts < maxAttempts) {
          try {
            const result = await model.forward('health check');

            if (!mounted) return;

            if (result instanceof Float32Array && result.length === 384) {
              if (DEBUG)
                console.log(
                  '[ExecuTorch] Health check passed. Status set to ready.',
                );
              setHealthCheckDone(true);
              setStatus('ready');

              return;
            }

            throw new Error('Health check returned invalid embedding format');
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            const isGeneratingError = error.message.includes(
              'currently generating',
            );

            if (isGeneratingError && attempts < maxAttempts - 1) {
              if (DEBUG)
                console.log(
                  `[ExecuTorch] Model busy (attempt ${attempts + 1}/${maxAttempts}). Retrying in 500ms...`,
                );
              attempts++;
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }

            if (mounted) {
              console.error('[ExecuTorch] Health check failed:', err);
              setInitError(error);
              setStatus('error');
            }

            return;
          }
        }
      }

      healthCheck();

      return () => {
        mounted = false;
      };
    }
  }, [model.isReady, model.isGenerating, status, healthCheckDone, model]);

  // Propagate model-level errors
  useEffect(() => {
    if (model.error && status !== 'error') {
      setStatus('error');
      setInitError(model.error);
    }
  }, [model.error, status]);

  const embed = useCallback(
    async (text: string) => {
      if (status !== 'ready') {
        throw new Error(`ExecuTorch model not ready. Status: ${status}`);
      }

      return model.forward(text);
    },
    [model, status],
  );

  return {
    downloadProgress: model.downloadProgress,
    embed,
    error: initError || model.error,
    status,
  };
}
