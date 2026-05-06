import { render, screen } from '@testing-library/react-native';

import { ChatMessageBubble, type ChatMessageProps } from './ChatMessage';

function makeMessage(role: 'assistant' | 'user', content: string) {
  return { content, id: '1', role };
}

const DEFAULT_PROPS: ChatMessageProps = {
  isStreaming: false,
  message: makeMessage('user', 'Hello'),
};

function renderChatMessageBubble(overrides: Partial<ChatMessageProps> = {}) {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<ChatMessageBubble {...props} />);
}

describe('ChatMessageBubble', () => {
  it('renders user message text', () => {
    renderChatMessageBubble({ message: makeMessage('user', 'Hello') });
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders assistant message text', () => {
    renderChatMessageBubble({
      message: makeMessage('assistant', 'Hi there'),
    });
    expect(screen.getByText('Hi there')).toBeTruthy();
  });

  it('shows TypingDots when streaming an empty assistant message', () => {
    renderChatMessageBubble({
      isStreaming: true,
      message: makeMessage('assistant', ''),
    });

    expect(screen.queryByTestId('chat-message-text')).toBeNull();
  });

  it('does not show TypingDots when not streaming', () => {
    renderChatMessageBubble({
      isStreaming: false,
      message: makeMessage('assistant', ''),
    });

    expect(screen.getByTestId('chat-message-text')).toBeTruthy();
  });

  it('does not show TypingDots when assistant message has content', () => {
    renderChatMessageBubble({
      isStreaming: true,
      message: makeMessage('assistant', 'Some text'),
    });

    expect(screen.getByTestId('chat-message-text')).toBeTruthy();
  });

  it('shows cursor when streaming assistant message with content', () => {
    renderChatMessageBubble({
      isStreaming: true,
      message: makeMessage('assistant', 'Streaming'),
    });

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('Streaming');
    expect(children[1]).toBeTruthy();
    expect(children[1].props.children).toBe('▌');
  });

  it('does not show cursor when not streaming', () => {
    renderChatMessageBubble({
      isStreaming: false,
      message: makeMessage('assistant', 'Done'),
    });

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('Done');
    expect(children[1]).toBeFalsy();
  });

  it('does not show cursor for user messages even when streaming', () => {
    renderChatMessageBubble({
      isStreaming: true,
      message: makeMessage('user', 'My message'),
    });

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('My message');
    expect(children[1]).toBeFalsy();
  });
});
