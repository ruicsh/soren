import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';

import ChatbotsScreen from './chatbots';

vi.mock('@/hooks/use-chatbot-config', () => ({
  useChatbotConfig: vi.fn(),
}));

describe('ChatbotsScreen', () => {
  const mockBack = vi.fn();
  const mockPush = vi.fn();
  const mockSelectChatbot = vi.fn();
  const mockDeleteChatbot = vi.fn();

  const mockChatbots = [
    {
      lastConversationAt: 1714992000000,
      lastConversationSnippet: 'Hello bot 1',
      llmModel: 'm1',
      llmProvider: 'p1',
      name: 'Bot 1',
      uuid: 'uuid-1',
    },
    {
      lastConversationAt: 1714991000000,
      lastConversationSnippet: 'Hello bot 2',
      llmModel: 'm2',
      llmProvider: 'p2',
      name: 'Bot 2',
      uuid: 'uuid-2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      back: mockBack,
      push: mockPush,
    } as any);

    vi.mocked(useChatbotConfig).mockReturnValue({
      chatbots: mockChatbots,
      config: mockChatbots[0],
      deleteChatbot: mockDeleteChatbot,
      selectChatbot: mockSelectChatbot,
    } as any);
  });

  it('renders list of chatbots', () => {
    render(<ChatbotsScreen />);

    expect(screen.getByText('Bot 1')).toBeTruthy();
    expect(screen.getByText('Bot 2')).toBeTruthy();
    expect(screen.getByText('Hello bot 1')).toBeTruthy();
    expect(screen.getByText('Hello bot 2')).toBeTruthy();
  });

  it('navigates back when Done is pressed', () => {
    render(<ChatbotsScreen />);

    fireEvent.press(screen.getByText('Done'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to settings in create mode when Plus is pressed', () => {
    render(<ChatbotsScreen />);

    fireEvent.press(screen.getByLabelText('Add chatbot'));
    expect(mockPush).toHaveBeenCalledWith('/chatbot-settings?mode=create');
  });

  it('selects chatbot and goes back when item is pressed', () => {
    render(<ChatbotsScreen />);

    fireEvent.press(screen.getByText('Bot 2'));
    expect(mockSelectChatbot).toHaveBeenCalledWith('uuid-2');
    expect(mockBack).toHaveBeenCalled();
  });
});
