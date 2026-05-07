import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import { ChatbotsHeader } from './ChatbotsHeader';

const DEFAULT_PROPS = {
  onAdd: vi.fn(),
  onDone: vi.fn(),
};

describe('ChatbotsHeader', () => {
  const renderChatbotsHeader = (overrides = {}) => {
    const props = { ...DEFAULT_PROPS, ...overrides };

    return {
      ...render(<ChatbotsHeader {...props} />),
      props,
    };
  };

  it('renders title and buttons', () => {
    renderChatbotsHeader();

    expect(screen.getByText('Chatbots')).toBeOnTheScreen();
    expect(screen.getByText('Done')).toBeOnTheScreen();
    expect(screen.getByLabelText('Add chatbot')).toBeOnTheScreen();
  });

  it('calls onDone when Done is pressed', () => {
    const { props } = renderChatbotsHeader();

    fireEvent.press(screen.getByText('Done'));

    expect(props.onDone).toHaveBeenCalled();
  });

  it('calls onAdd when Add is pressed', () => {
    const { props } = renderChatbotsHeader();

    fireEvent.press(screen.getByLabelText('Add chatbot'));

    expect(props.onAdd).toHaveBeenCalled();
  });
});
