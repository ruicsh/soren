import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';

import { ChatbotConfigProvider } from '@/context/ChatbotConfigContext';
import { saveChatbotConfig } from '@/lib/chatbot-config';

import { useChatbotConfig } from './use-chatbot-config';

const mockConfig: any = {
  llmModel: 'llama-3.1-8b-instant',
  llmProvider: 'groq',
  name: 'Soren',
  systemPrompt: 'persona',
  uuid: 'uuid-123',
  voiceId: null,
};

vi.mock('@/lib/chatbot-config', () => ({
  appendChatTurn: vi.fn(),
  deleteChatbot: vi.fn(),
  getChatbotConfigPath: vi.fn(),
  getChatbotsRootPath: vi.fn(),
  listChatbotConfigs: vi.fn(() => Promise.resolve([mockConfig])),
  loadChatbotConfig: vi.fn(),
  loadOrCreateDefaultChatbotConfig: vi.fn(() => Promise.resolve(mockConfig)),
  saveChatbotConfig: vi.fn(),
}));

vi.mock('@/lib/byok-keys', () => ({
  deleteApiKey: vi.fn(),
  getApiKey: vi.fn(() => Promise.resolve('mock-key')),
  setApiKey: vi.fn(),
}));

vi.mock('@/lib/llm/models', () => ({
  fetchModels: vi.fn(() => Promise.resolve([])),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatbotConfigProvider>{children}</ChatbotConfigProvider>
);

const DEFAULT_OPTIONS = { wrapper };

async function renderUseChatbotConfig({
  overrides = {},
}: { overrides?: Parameters<typeof renderHook>[1] } = {}) {
  const renderResult = renderHook(() => useChatbotConfig(), {
    ...DEFAULT_OPTIONS,
    ...overrides,
  });

  await waitFor(() =>
    expect(renderResult.result.current.isLoading).toBe(false),
  );

  return renderResult;
}

describe('useChatbotConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads config on mount', async () => {
    const { result } = await renderUseChatbotConfig();

    expect(result.current.config).toEqual(mockConfig);
  });

  it('updates local config state', async () => {
    const { result } = await renderUseChatbotConfig();

    act(() => {
      result.current.updateConfig({ name: 'New Name' });
    });

    expect(result.current.config?.name).toBe('New Name');
  });

  it('calls saveChatbotConfig when saving', async () => {
    const { result } = await renderUseChatbotConfig();

    await act(async () => {
      await result.current.save();
    });

    expect(saveChatbotConfig).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Soren' }),
    );
  });

  it('calls saveChatbotConfig with updates when using saveWithConfig', async () => {
    const { result } = await renderUseChatbotConfig();

    await act(async () => {
      await result.current.saveWithConfig({ name: 'Atomic Update' });
    });

    expect(saveChatbotConfig).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Atomic Update' }),
    );
  });
});
