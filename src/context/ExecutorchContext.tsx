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

export const ExecutorchContext = createContext<ExecutorchContextType | null>(
  null,
);

export function ExecutorchProvider(props: PropsWithChildren) {
  const { children } = props;
  const executorch = useExecutorch();

  // In test environments, if useExecutorch returns an object with a mock,
  // ensure we don't render the modal if it depends on real native modules that might fail.
  const isTest = process.env.NODE_ENV === 'test';

  return (
    <ExecutorchContext.Provider value={executorch}>
      {children}
      {!isTest && (
        <ModelDownloadModal
          downloadProgress={executorch.downloadProgress}
          error={executorch.error}
          status={executorch.status}
        />
      )}
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
