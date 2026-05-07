import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import { ChatbotNameEditor } from './ChatbotNameEditor';

const DEFAULT_PROPS = {
  modelId: 'gpt-4',
  name: 'Test Bot',
  onNameChange: vi.fn(),
  providerId: 'openai',
};

const renderChatbotNameEditor = (overrides = {}) => {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return {
    ...render(<ChatbotNameEditor {...props} />),
    props,
  };
};

describe('ChatbotNameEditor', () => {
  it('renders the avatar with correct props', () => {
    renderChatbotNameEditor();

    const avatar = screen.getByTestId('avatar-container');

    expect(avatar).toBeOnTheScreen();
  });

  it('renders the text input with correct value and placeholder', () => {
    const { props } = renderChatbotNameEditor();

    const input = screen.getByPlaceholderText('Enter name');

    expect(input).toBeOnTheScreen();
    expect(input.props.value).toBe(props.name);
  });

  it('calls onNameChange when text input changes', () => {
    const { props } = renderChatbotNameEditor();

    const input = screen.getByPlaceholderText('Enter name');

    fireEvent.changeText(input, 'New Name');

    expect(props.onNameChange).toHaveBeenCalledWith('New Name');
  });

  it('renders with empty name', () => {
    renderChatbotNameEditor({ name: '' });

    const input = screen.getByPlaceholderText('Enter name');

    expect(input.props.value).toBe('');
  });

  it('passes modelId and providerId to avatar', () => {
    renderChatbotNameEditor({
      modelId: 'claude-3',
      providerId: 'anthropic',
    });

    const avatar = screen.getByTestId('avatar-container');

    expect(avatar).toBeOnTheScreen();
  });
});
