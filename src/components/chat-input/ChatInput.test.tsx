import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react-native';

import { ChatInput } from './ChatInput';
import { emitSpeechEvent } from '@/tests/test-setup';

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

  it('hides send button for whitespace-only text', () => {
    const onSendSpy = vi.fn();
    render(<ChatInput onSend={onSendSpy} />);

    const input = screen.getByPlaceholderText('Message…');
    fireEvent.changeText(input, '   ');

    // send button is not rendered — mic button stays visible
    expect(screen.queryByTestId('send-button')).toBeNull();
    expect(screen.getByTestId('mic-button')).toBeTruthy();
  });

  it('shows mic button when input is empty', () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByTestId('mic-button')).toBeTruthy();
  });

  it('auto-sends transcript when dictation stops', async () => {
    const onSendSpy = vi.fn();
    render(<ChatInput onSend={onSendSpy} />);

    const micButton = screen.getByTestId('mic-button');
    fireEvent.press(micButton);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Listening…')).toBeTruthy(),
    );

    act(() => {
      emitSpeechEvent('result', {
        isFinal: true,
        results: [{ transcript: 'Hello world', confidence: 0.9, segments: [] }],
      });
    });

    act(() => {
      emitSpeechEvent('end', null);
    });

    await waitFor(() => {
      expect(onSendSpy).toHaveBeenCalledTimes(1);
      expect(onSendSpy).toHaveBeenCalledWith('Hello world');
    });
  });

  it('does not send duplicate transcript on re-render', async () => {
    const onSendSpy = vi.fn();
    const { rerender } = render(
      <ChatInput onSend={onSendSpy} placeholder="Message…" />,
    );

    const micButton = screen.getByTestId('mic-button');
    fireEvent.press(micButton);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Listening…')).toBeTruthy(),
    );

    act(() => {
      emitSpeechEvent('result', {
        isFinal: true,
        results: [{ transcript: 'Once', confidence: 0.9, segments: [] }],
      });
    });

    act(() => {
      emitSpeechEvent('end', null);
    });

    await waitFor(() => expect(onSendSpy).toHaveBeenCalledTimes(1));

    // Force a re-render while transcript is still "Once"
    rerender(<ChatInput onSend={onSendSpy} placeholder="Message…" />);

    // onSend should still have been called only once
    expect(onSendSpy).toHaveBeenCalledTimes(1);
  });
});
