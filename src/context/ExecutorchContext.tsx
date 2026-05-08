import React, {
  createContext,
  type PropsWithChildren,
  useContext,
} from 'react';

import { ModelDownloadModal } from '@/components/model-download-modal/ModelDownloadModal';
import { type ExecutorchStatus, useExecutorch } from '@/hooks/use-executorch';

interface ExecutorchContextType {
  downloadProgress: number;
  embed: (text: string) => Promise<Float32Array>;
  error: Error | null;
  status: ExecutorchStatus;
}

const ExecutorchContext = createContext<ExecutorchContextType | null>(null);

export function ExecutorchProvider(props: PropsWithChildren) {
  const { children } = props;
  const executorch = useExecutorch();

  return (
    <ExecutorchContext.Provider value={executorch}>
      {children}
      <ModelDownloadModal
        downloadProgress={executorch.downloadProgress}
        error={executorch.error}
        status={executorch.status}
      />
    </ExecutorchContext.Provider>
  );
}

export function useExecutorchContext() {
  const context = useContext(ExecutorchContext);
  if (!context) {
    throw new Error(
      'useExecutorchContext must be used within an ExecutorchProvider',
    );
  }

  return context;
}
