import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';

import { useVectorStore } from '@/hooks/use-vector-store';

import {
  useVectorStoreContext,
  VectorStoreProvider,
} from './VectorStoreContext';

vi.mock('@/hooks/use-vector-store', () => ({
  useVectorStore: vi.fn(),
}));

function TestComponent() {
  const { status } = useVectorStoreContext();

  return <Text>{`Status: ${status}`}</Text>;
}

describe('VectorStoreContext', () => {
  const DEFAULT_VALUE = {
    error: null,
    insertEmbedding: vi.fn(),
    searchSimilar: vi.fn(),
    status: 'initializing',
  };

  beforeEach(() => {
    vi.mocked(useVectorStore).mockReturnValue(DEFAULT_VALUE as any);
  });

  it('provides vector store value to children', () => {
    render(
      <VectorStoreProvider>
        <TestComponent />
      </VectorStoreProvider>,
    );

    expect(screen.getByText('Status: initializing')).toBeOnTheScreen();
  });

  it('throws error when used outside of provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useVectorStoreContext must be used within a VectorStoreProvider',
    );

    consoleSpy.mockRestore();
  });
});
