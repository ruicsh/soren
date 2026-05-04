import { render, screen } from '@testing-library/react-native';

import { ChatMessageBubble } from './ChatMessage';

function makeMessage(role: 'assistant' | 'user', content: string) {
  return { content, id: '1', role };
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
        isStreaming={true}
        message={makeMessage('assistant', '')}
      />,
    );

    expect(queryByTestId('chat-message-text')).toBeNull();
  });

  it('does not show TypingDots when not streaming', () => {
    render(
      <ChatMessageBubble
        isStreaming={false}
        message={makeMessage('assistant', '')}
      />,
    );

    expect(screen.getByTestId('chat-message-text')).toBeTruthy();
  });

  it('does not show TypingDots when assistant message has content', () => {
    render(
      <ChatMessageBubble
        isStreaming={true}
        message={makeMessage('assistant', 'Some text')}
      />,
    );

    expect(screen.getByTestId('chat-message-text')).toBeTruthy();
  });

  it('shows cursor when streaming assistant message with content', () => {
    render(
      <ChatMessageBubble
        isStreaming={true}
        message={makeMessage('assistant', 'Streaming')}
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
        isStreaming={false}
        message={makeMessage('assistant', 'Done')}
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
        isStreaming={true}
        message={makeMessage('user', 'My message')}
      />,
    );

    const text = screen.getByTestId('chat-message-text');
    const children = text.props.children;
    expect(children[0]).toBe('My message');
    expect(children[1]).toBeFalsy();
  });
});
