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
      lastConversationAt: new Date('2026-05-07T10:00:00Z').getTime(), // Today
      lastConversationSnippet: 'Hello bot today',
      llmModel: 'm1',
      llmProvider: 'p1',
      name: 'Bot Today',
      uuid: 'uuid-today',
    },
    {
      lastConversationAt: new Date('2026-05-06T10:00:00Z').getTime(), // Yesterday
      lastConversationSnippet: 'Hello bot yesterday',
      llmModel: 'm2',
      llmProvider: 'p2',
      name: 'Bot Yesterday',
      uuid: 'uuid-yesterday',
    },
    {
      lastConversationAt: new Date('2026-05-05T10:00:00Z').getTime(), // Tuesday (within 6 days)
      lastConversationSnippet: 'Hello bot tuesday',
      llmModel: 'm3',
      llmProvider: 'p3',
      name: 'Bot Tuesday',
      uuid: 'uuid-tuesday',
    },
    {
      lastConversationAt: new Date('2026-04-30T10:00:00Z').getTime(), // Older (Wed 30 Apr)
      lastConversationSnippet: 'Hello bot older',
      llmModel: 'm4',
      llmProvider: 'p4',
      name: 'Bot Older',
      uuid: 'uuid-older',
    },
    {
      lastConversationSnippet: 'Hello bot no date',
      llmModel: 'm5',
      llmProvider: 'p5',
      name: 'Bot No Date',
      uuid: 'uuid-no-date',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00Z')); // Set to today for consistent tests
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders list of chatbots grouped by date', () => {
    render(<ChatbotsScreen />);

    expect(screen.getByText('Bot Today')).toBeTruthy();
    expect(screen.getByText('Bot Yesterday')).toBeTruthy();
    expect(screen.getByText('Bot Tuesday')).toBeTruthy();
    expect(screen.getByText('Bot Older')).toBeTruthy();
    expect(screen.getByText('Bot No Date')).toBeTruthy();

    // Check section headers
    expect(screen.getByText('today')).toBeTruthy();
    expect(screen.getByText('yesterday')).toBeTruthy();
    expect(screen.getByText('Tuesday')).toBeTruthy(); // Tuesday since within 6 days
    expect(screen.getByText('Thu 30 Apr')).toBeTruthy(); // Older date
    expect(screen.getByText('Older')).toBeTruthy(); // No date
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

    fireEvent.press(screen.getByText('Bot Yesterday'));
    expect(mockSelectChatbot).toHaveBeenCalledWith('uuid-yesterday');
    expect(mockBack).toHaveBeenCalled();
  });
});
