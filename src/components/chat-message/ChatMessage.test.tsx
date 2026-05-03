import { render, screen } from '@testing-library/react-native';

import { ChatMessageBubble } from './ChatMessage';

function makeMessage(role: 'user' | 'assistant', content: string) {
  return { id: '1', role, content };
}

describe('ChatMessageBubble', () => {
  it('renders user message text', () => {
    render(<ChatMessageBubble message={makeMessage('user', 'Hello')} />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders assistant message text', () => {
    render(
      <ChatMessageBubble message={makeMessage('assistant', 'Hi there')} />,
    );
    expect(screen.getByText('Hi there')).toBeTruthy();
  });

  it('shows TypingDots when streaming an empty assistant message', () => {
    const { queryByTestId } = render(
      <ChatMessageBubble
        message={makeMessage('assistant', '')}
        isStreaming={true}
      />,
    );

    expect(queryByTestId('chat-message-text')).toBeNull();
  });

  it('does not show TypingDots when not streaming', () => {
    render(
      <ChatMessageBubble
        message={makeMessage('assistant', '')}
        isStreaming={false}
      />,
    );

    expect(screen.getByTestId('chat-message-text')).toBeTruthy();
  });

  it('does not show TypingDots when assistant message has content', () => {
    render(
      <ChatMessageBubble
        message={makeMessage('assistant', 'Some text')}
        isStreaming={true}
      />,
    );

    expect(screen.getByTestId('chat-message-text')).toBeTruthy();
  });

  it('shows cursor when streaming assistant message with content', () => {
    render(
      <ChatMessageBubble
        message={makeMessage('assistant', 'Streaming')}
        isStreaming={true}
      />,
    );

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('Streaming');
    expect(children[1]).toBeTruthy();
    expect(children[1].props.children).toBe('▌');
  });

  it('does not show cursor when not streaming', () => {
    render(
      <ChatMessageBubble
        message={makeMessage('assistant', 'Done')}
        isStreaming={false}
      />,
    );

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('Done');
    expect(children[1]).toBeFalsy();
  });

  it('does not show cursor for user messages even when streaming', () => {
    render(
      <ChatMessageBubble
        message={makeMessage('user', 'My message')}
        isStreaming={true}
      />,
    );

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('My message');
    expect(children[1]).toBeFalsy();
  });
});
