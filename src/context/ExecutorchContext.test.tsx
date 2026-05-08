import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { type ExecutorchStatus, useExecutorch } from '@/hooks/use-executorch';

import { ExecutorchProvider, useExecutorchContext } from './ExecutorchContext';

vi.mock('@/hooks/use-executorch', () => ({
  useExecutorch: vi.fn(),
}));

vi.mock('@/components/model-download-modal/ModelDownloadModal', () => ({
  ModelDownloadModal: vi.fn(() => null),
}));

function TestComponent() {
  const { status } = useExecutorchContext();

  return <Text>{`Status: ${status}`}</Text>;
}

describe('ExecutorchContext', () => {
  const DEFAULT_EXECUTORCH_VALUE = {
    downloadProgress: 0,
    embed: vi.fn(),
    error: null,
    status: 'initializing' as ExecutorchStatus,
  };

  beforeEach(() => {
    vi.mocked(useExecutorch).mockReturnValue(DEFAULT_EXECUTORCH_VALUE);
  });

  it('provides executorch value to children', () => {
    render(
      <ExecutorchProvider>
        <TestComponent />
      </ExecutorchProvider>,
    );

    expect(screen.getByText('Status: initializing')).toBeOnTheScreen();
  });

  it('throws error when used outside of provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useExecutorchContext must be used within an ExecutorchProvider',
    );

    consoleSpy.mockRestore();
  });

  it('updates when hook value changes', () => {
    const { rerender } = render(
      <ExecutorchProvider>
        <TestComponent />
      </ExecutorchProvider>,
    );

    vi.mocked(useExecutorch).mockReturnValue({
      ...DEFAULT_EXECUTORCH_VALUE,
      status: 'ready' as ExecutorchStatus,
    });

    rerender(
      <ExecutorchProvider>
        <TestComponent />
      </ExecutorchProvider>,
    );

    expect(screen.getByText('Status: ready')).toBeOnTheScreen();
  });
});
