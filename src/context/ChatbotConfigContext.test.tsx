import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  ChatbotConfigProvider,
  useChatbotConfigContext,
} from '@/context/ChatbotConfigContext';
import { ExecutorchContext } from '@/context/ExecutorchContext';
import { deleteApiKey as mockDeleteApiKey } from '@/lib/byok-keys';
import {
  listChatbotConfigs,
  loadOrCreateDefaultChatbotConfig,
} from '@/lib/chatbot-config';

vi.mock('@/lib/memory-store', () => ({
  openMemoryStore: vi.fn(() =>
    Promise.resolve({
      close: vi.fn(),
      insertInteraction: vi.fn(),
      isReady: true,
      status: 'ready',
    }),
  ),
}));

vi.mock('@/lib/chatbot-config', () => ({
  appendChatTurn: vi.fn(),
  deleteChatbot: vi.fn(),
  listChatbotConfigs: vi.fn(),
  loadOrCreateDefaultChatbotConfig: vi.fn(),
  saveChatbotConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/byok-keys', () => ({
  deleteApiKey: vi.fn(),
  getApiKey: vi.fn(() => Promise.resolve(null)),
  setApiKey: vi.fn(),
}));

vi.mock('@/hooks/use-tts', () => ({
  useTTS: () => ({ availableVoices: [] }),
}));

vi.mock('@/lib/llm/models', () => ({
  fetchModels: vi.fn(() => Promise.resolve([])),
}));

const mockBots = [
  { llmModel: 'm1', llmProvider: 'groq', name: 'Bot 1', uuid: 'bot-1' },
  { llmModel: 'm1', llmProvider: 'groq', name: 'Bot 2', uuid: 'bot-2' },
];

describe('ChatbotConfigContext switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listChatbotConfigs as any).mockResolvedValue(mockBots);
    (loadOrCreateDefaultChatbotConfig as any).mockResolvedValue(mockBots[0]);
  });

  it('switches active chatbot correctly', async () => {
    const mockExecutorch = {
      downloadProgress: 1,
      embed: vi.fn(() => Promise.resolve(new Float32Array(384).fill(0.1))),
      error: null,
      status: 'ready' as const,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ExecutorchContext.Provider value={mockExecutorch}>
        <ChatbotConfigProvider>{children}</ChatbotConfigProvider>
      </ExecutorchContext.Provider>
    );

    const { result } = await renderHook(() => useChatbotConfigContext(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.config?.uuid).toBe('bot-1');

    await act(async () => {
      result.current.selectChatbot('bot-2');
    });

    expect(result.current.config?.uuid).toBe('bot-2');
  });

  it('preserves active chatbot across re-mounts/re-runs', async () => {
    const mockExecutorch = {
      downloadProgress: 1,
      embed: vi.fn(() => Promise.resolve(new Float32Array(384).fill(0.1))),
      error: null,
      status: 'ready' as const,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ExecutorchContext.Provider value={mockExecutorch}>
        <ChatbotConfigProvider>{children}</ChatbotConfigProvider>
      </ExecutorchContext.Provider>
    );

    const { rerender, result } = await renderHook(
      () => useChatbotConfigContext(),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.selectChatbot('bot-2');
    });
    expect(result.current.config?.uuid).toBe('bot-2');

    // Simulate re-render/re-mount cycle logic
    rerender({});

    // The effect inside the provider will re-run but functional update should keep bot-2
    await waitFor(() => expect(result.current.config?.uuid).toBe('bot-2'));
  });

  it('deletes provider key only if no other bot uses it', async () => {
    const mockExecutorch = {
      downloadProgress: 1,
      embed: vi.fn(() => Promise.resolve(new Float32Array(384).fill(0.1))),
      error: null,
      status: 'ready' as const,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ExecutorchContext.Provider value={mockExecutorch}>
        <ChatbotConfigProvider>{children}</ChatbotConfigProvider>
      </ExecutorchContext.Provider>
    );

    const { result } = await renderHook(() => useChatbotConfigContext(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Case 1: Delete bot-1, but bot-2 still uses 'groq'
    await act(async () => {
      await result.current.deleteChatbot('bot-1');
    });

    expect(mockDeleteApiKey).not.toHaveBeenCalledWith('bot-1', 'groq');

    // Case 2: Delete bot-2 (last groq bot)
    // Manually update the state because deleteChatbot uses the 'chatbots' state from closure
    await act(async () => {
      // simulate the listChatbotConfigs update that usually happens inside refreshChatbots
      (listChatbotConfigs as any).mockResolvedValue([mockBots[1]]);
      await result.current.refreshChatbots();
    });

    await act(async () => {
      await result.current.deleteChatbot('bot-2');
    });

    expect(mockDeleteApiKey).toHaveBeenCalledWith('bot-2', 'groq');
  });
});
