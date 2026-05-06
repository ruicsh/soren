import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
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
  const mockUpdateConfig = vi.fn();
  const mockBack = vi.fn();

  const mockConfig = {
    llmModel: 'llama-3.1-8b-instant',
    llmProvider: 'groq',
    name: 'Soren',
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

  it('updates local nameDraft when typing', () => {
    render(<ChatbotSettingsScreen />);
    const input = screen.getByDisplayValue('Soren');
    fireEvent.changeText(input, 'New Bot');
    expect(screen.getByDisplayValue('New Bot')).toBeTruthy();
    // mockUpdateConfig NOT called yet, only on save
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it('calls updateConfig with nameDraft when saving', async () => {
    render(<ChatbotSettingsScreen />);
    const input = screen.getByDisplayValue('Soren');
    fireEvent.changeText(input, 'Manually Typed Name');

    const saveBtn = screen.getByText('Save');
    fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        name: 'Manually Typed Name',
      });
    });
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
