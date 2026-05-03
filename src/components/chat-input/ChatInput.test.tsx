import { render, screen, fireEvent } from '@testing-library/react-native';

import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  it('renders placeholder text', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Message…')).toBeTruthy();
  });

  it('calls onSend with trimmed text when send is pressed', () => {
    const onSendSpy = vi.fn();
    render(<ChatInput onSend={onSendSpy} />);

    const input = screen.getByPlaceholderText('Message…');
    fireEvent.changeText(input, '  Hello world  ');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSendSpy).toHaveBeenCalledTimes(1);
    expect(onSendSpy).toHaveBeenCalledWith('Hello world');
  });

  it('clears text after send', () => {
    const onSendSpy = vi.fn();
    render(<ChatInput onSend={onSendSpy} />);

    const input = screen.getByPlaceholderText('Message…');
    fireEvent.changeText(input, 'Test');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSendSpy).toHaveBeenCalledWith('Test');
    // After clearing, the input value should be empty
    expect(input.props.value).toBe('');
  });

  it('does not call onSend for empty/whitespace-only text', () => {
    const onSendSpy = vi.fn();
    render(<ChatInput onSend={onSendSpy} />);

    const input = screen.getByPlaceholderText('Message…');
    fireEvent.changeText(input, '   ');

    const sendButton = screen.getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSendSpy).not.toHaveBeenCalled();
  });
});
