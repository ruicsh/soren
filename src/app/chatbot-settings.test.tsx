import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { vi } from 'vitest';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';

import ChatbotSettingsScreen from './chatbot-settings';

// Mock expo-router
vi.mock('expo-router', () => ({
  useLocalSearchParams: vi.fn(() => ({})),
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    setParams: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-chatbot-config', () => ({
  useChatbotConfig: vi.fn(),
}));

describe('ChatbotSettingsScreen', () => {
  const mockSave = vi.fn();
  const mockSaveWithConfig = vi.fn();
  const mockUpdateConfig = vi.fn();
  const mockBack = vi.fn();

  const mockConfig = {
    llmModel: 'llama-3.1-8b-instant',
    llmProvider: 'groq',
    name: 'Soren',
    systemPrompt: 'You are helpful',
    uuid: 'uuid-123',
    voiceId: null,
  };

  const mockUseChatbotConfig = (overrides = {}) => {
    const defaultValues = {
      apiKeyDraft: '',
      availableModels: [],
      availableProviders: [],
      availableVoices: [],
      chatbots: [mockConfig],
      clearProviderApiKey: vi.fn(),
      config: mockConfig,
      createChatbot: vi.fn(),
      deleteChatbot: vi.fn(),
      error: null,
      hasProviderKey: false,
      isLoading: false,
      isSaving: false,
      modelsError: null,
      modelsLoading: false,
      refreshChatbots: vi.fn(),
      refreshModels: vi.fn(),
      revealKey: vi.fn(),
      save: mockSave,
      saveWithConfig: mockSaveWithConfig,
      selectChatbot: vi.fn(),
      updateApiKeyDraft: vi.fn(),
      updateConfig: mockUpdateConfig,
      updateLastConversation: vi.fn(),
      updateLastConversationAt: vi.fn(),
    };

    return (useChatbotConfig as any).mockReturnValue({
      ...defaultValues,
      ...overrides,
    });
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
    const router = useRouter();
    (router.back as any).mockImplementation(mockBack);

    // useLocalSearchParams is mocked in test-setup.ts
    // We access the mock and set its return value
    (useLocalSearchParams as any).mockReturnValue({ mode: undefined });

    mockUseChatbotConfig();
  });

  it('renders config data', () => {
    render(<ChatbotSettingsScreen />);
    expect(screen.getByDisplayValue('Soren')).toBeTruthy();
    expect(screen.getByText('uuid-123')).toBeTruthy();
  });

  it('auto-saves name when typing (debounced)', async () => {
    vi.useFakeTimers();
    render(<ChatbotSettingsScreen />);
    const input = screen.getByDisplayValue('Soren');
    fireEvent.changeText(input, 'New Bot Name');

    // Should not save immediately
    expect(mockSaveWithConfig).not.toHaveBeenCalled();

    // Advance time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSaveWithConfig).toHaveBeenCalledWith({
      name: 'New Bot Name',
    });
    vi.useRealTimers();
  });

  it('calls save with API key on blur', async () => {
    mockUseChatbotConfig({
      apiKeyDraft: 'new-key',
    });
    render(<ChatbotSettingsScreen />);

    const keyInput = screen.getByPlaceholderText('Enter groq key');
    fireEvent(keyInput, 'blur');

    expect(mockSave).toHaveBeenCalled();
  });

  it('only calls createChatbot once in create mode', async () => {
    const mockCreateChatbot = vi.fn();
    (useLocalSearchParams as any).mockReturnValue({ mode: 'create' });

    mockUseChatbotConfig({
      chatbots: [],
      config: null,
      createChatbot: mockCreateChatbot,
    });

    const { rerender } = render(<ChatbotSettingsScreen />);

    // Initial call
    expect(mockCreateChatbot).toHaveBeenCalledTimes(1);

    // Rerender should not call again
    rerender(<ChatbotSettingsScreen />);
    expect(mockCreateChatbot).toHaveBeenCalledTimes(1);
  });

  it('calls revealKey when toggling visibility on empty draft with existing key', async () => {
    const mockRevealKey = vi.fn();
    mockUseChatbotConfig({
      availableProviders: [
        { defaultModel: 'm1', id: 'groq', label: 'Groq' } as any,
      ],
      hasProviderKey: true,
      revealKey: mockRevealKey,
    });

    render(<ChatbotSettingsScreen />);

    const eyeBtn = screen.getByTestId('eye-icon-button');
    await act(async () => {
      fireEvent.press(eyeBtn);
    });

    expect(mockRevealKey).toHaveBeenCalled();
  });
});
