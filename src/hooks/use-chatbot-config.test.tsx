import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';

import { ChatbotConfigProvider } from '@/context/ChatbotConfigContext';
import {
  loadOrCreateDefaultChatbotConfig,
  saveChatbotConfig,
} from '@/lib/chatbot-config';

import { useChatbotConfig } from './use-chatbot-config';

vi.mock('@/lib/chatbot-config', () => ({
  loadOrCreateDefaultChatbotConfig: vi.fn(),
  saveChatbotConfig: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatbotConfigProvider>{children}</ChatbotConfigProvider>
);

const DEFAULT_OPTIONS = { wrapper };

function renderUseChatbotConfig({
  overrides = {},
}: { overrides?: Parameters<typeof renderHook>[1] } = {}) {
  return renderHook(() => useChatbotConfig(), {
    ...DEFAULT_OPTIONS,
    ...overrides,
  });
}

describe('useChatbotConfig', () => {
  const mockConfig = {
    llmModel: 'llama-3.1-8b-instant',
    llmProvider: 'groq',
    name: 'Soren',
    uuid: 'uuid-123',
    voiceId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadOrCreateDefaultChatbotConfig).mockResolvedValue(mockConfig);
  });

  it('loads config on mount', async () => {
    const { result } = renderUseChatbotConfig();

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.config).toEqual(mockConfig);
  });

  it('updates local config state', async () => {
    const { result } = renderUseChatbotConfig();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateConfig({ name: 'New Name' });
    });

    expect(result.current.config?.name).toBe('New Name');
  });

  it('calls saveChatbotConfig when saving', async () => {
    const { result } = renderUseChatbotConfig();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.save();
    });

    expect(saveChatbotConfig).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Soren' }),
    );
  });
});
