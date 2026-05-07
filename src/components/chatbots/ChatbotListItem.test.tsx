import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import type { ChatbotConfig } from '@/lib/chatbot-config';

import { ChatbotListItem } from './ChatbotListItem';

// Mock Swipeable to render children and actions directly
vi.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  default: ({ children, renderRightActions }: any) => (
    <>
      {children}
      {renderRightActions?.()}
    </>
  ),
}));

const DEFAULT_PROPS = {
  isActive: false,
  item: {
    lastConversationAt: 1714992000000,
    lastConversationSnippet: 'Hello snippet',
    llmModel: 'gpt-4o',
    llmProvider: 'openai',
    name: 'Test Bot',
    uuid: 'uuid-123',
  } as ChatbotConfig,
  onDelete: vi.fn(),
  onSelect: vi.fn(),
};

describe('ChatbotListItem', () => {
  const renderChatbotListItem = (overrides = {}) => {
    const props = { ...DEFAULT_PROPS, ...overrides };

    return {
      ...render(<ChatbotListItem {...props} />),
      props,
    };
  };

  it('renders chatbot information', () => {
    renderChatbotListItem();

    expect(screen.getByText('Test Bot')).toBeOnTheScreen();
    expect(screen.getByText('Hello snippet')).toBeOnTheScreen();
    // Time for 1714992000000 depends on local timezone but should be present
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeOnTheScreen();
  });

  it('renders placeholder snippet when no last conversation', () => {
    renderChatbotListItem({
      item: { ...DEFAULT_PROPS.item, lastConversationSnippet: undefined },
    });

    expect(screen.getByText('No messages yet')).toBeOnTheScreen();
  });

  it('calls onSelect when item is pressed', () => {
    const { props } = renderChatbotListItem();

    fireEvent.press(screen.getByText('Test Bot'));

    expect(props.onSelect).toHaveBeenCalledWith('uuid-123');
  });

  it('calls onDelete when delete button is pressed', () => {
    const { props } = renderChatbotListItem();

    fireEvent.press(screen.getByLabelText('Delete chatbot'));

    expect(props.onDelete).toHaveBeenCalledWith('uuid-123');
  });
});
