import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';

import ChatbotSettingsScreen from './chatbot-settings';

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

  beforeEach(() => {
    vi.clearAllMocks();
    const router = useRouter();
    vi.mocked(router.back).mockImplementation(mockBack);

    vi.mocked(useChatbotConfig).mockReturnValue({
      apiKeyDraft: '',
      availableModels: [],
      availableProviders: [],
      availableVoices: [],
      clearProviderApiKey: vi.fn(),
      config: mockConfig,
      error: null,
      hasProviderKey: false,
      isLoading: false,
      isSaving: false,
      modelsError: null,
      modelsLoading: false,
      refreshModels: vi.fn(),
      revealKey: vi.fn(),
      save: mockSave,
      updateApiKeyDraft: vi.fn(),
      updateConfig: mockUpdateConfig,
      updateLastConversation: vi.fn(),
      updateLastConversationAt: vi.fn(),
    });
  });

  it('renders config data', () => {
    render(<ChatbotSettingsScreen />);
    expect(screen.getByDisplayValue('Soren')).toBeTruthy();
    expect(screen.getByText('uuid-123')).toBeTruthy();
  });

  it('calls updateConfig when name changes', () => {
    render(<ChatbotSettingsScreen />);
    const input = screen.getByDisplayValue('Soren');
    fireEvent.changeText(input, 'New Bot');
    expect(mockUpdateConfig).toHaveBeenCalledWith({ name: 'New Bot' });
  });

  it('calls save and navigates back on save press', async () => {
    render(<ChatbotSettingsScreen />);
    const saveBtn = screen.getByText('Save');
    fireEvent.press(saveBtn);

    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates back on back button press', () => {
    render(<ChatbotSettingsScreen />);
    const backBtn = screen.getByLabelText('Go back');
    fireEvent.press(backBtn);
    expect(mockBack).toHaveBeenCalled();
  });

  it('calls revealKey when toggling visibility on empty draft with existing key', () => {
    const mockRevealKey = vi.fn();
    vi.mocked(useChatbotConfig).mockReturnValue({
      apiKeyDraft: '',
      availableModels: [],
      availableProviders: [
        { defaultModel: 'm1', id: 'groq', label: 'Groq' } as any,
      ],
      availableVoices: [],
      clearProviderApiKey: vi.fn(),
      config: mockConfig,
      error: null,
      hasProviderKey: true,
      isLoading: false,
      isSaving: false,
      modelsError: null,
      modelsLoading: false,
      refreshModels: vi.fn(),
      revealKey: mockRevealKey,
      save: mockSave,
      updateApiKeyDraft: vi.fn(),
      updateConfig: mockUpdateConfig,
      updateLastConversation: vi.fn(),
      updateLastConversationAt: vi.fn(),
    });

    render(<ChatbotSettingsScreen />);

    const eyeBtn = screen.getByTestId('eye-icon-button');
    fireEvent.press(eyeBtn);

    expect(mockRevealKey).toHaveBeenCalled();
  });
});
