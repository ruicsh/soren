import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { vi } from 'vitest';

import { ApiKeyRow } from './ApiKeyRow';

const DEFAULT_PROPS = {
  apiKeyDraft: '',
  hasProviderKey: false,
  onClear: vi.fn(),
  onReveal: vi.fn().mockResolvedValue(undefined),
  onSave: vi.fn(),
  onUpdateDraft: vi.fn(),
  providerLabel: 'OpenAI',
};

const renderApiKeyRow = (overrides = {}) => {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return {
    ...render(<ApiKeyRow {...props} />),
    props,
  };
};

describe('ApiKeyRow', () => {
  it('renders correctly with placeholder when no key is set', () => {
    renderApiKeyRow();

    expect(screen.getByPlaceholderText('Enter OpenAI key')).toBeOnTheScreen();
    expect(screen.queryByTestId('trash2-icon')).not.toBeOnTheScreen();
  });

  it('renders mask placeholder when key exists', () => {
    renderApiKeyRow({ hasProviderKey: true });

    expect(screen.getByPlaceholderText('••••••••••••')).toBeOnTheScreen();
  });

  it('updates draft on text change', () => {
    const { props } = renderApiKeyRow();

    fireEvent.changeText(
      screen.getByPlaceholderText('Enter OpenAI key'),
      'new-key',
    );

    expect(props.onUpdateDraft).toHaveBeenCalledWith('new-key');
  });

  it('calls onSave on blur if draft is not empty', () => {
    const { props } = renderApiKeyRow({ apiKeyDraft: 'some-key' });

    fireEvent(screen.getByDisplayValue('some-key'), 'blur');

    expect(props.onSave).toHaveBeenCalled();
  });

  it('toggles password visibility when eye icon is pressed', () => {
    renderApiKeyRow({ apiKeyDraft: 'secret-key' });
    const input = screen.getByDisplayValue('secret-key');

    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByTestId('eye-icon-button'));
    expect(input.props.secureTextEntry).toBe(false);

    fireEvent.press(screen.getByTestId('eye-icon-button'));
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('calls onReveal when eye is pressed and no draft but key exists', async () => {
    const { props } = renderApiKeyRow({
      apiKeyDraft: '',
      hasProviderKey: true,
    });

    fireEvent.press(screen.getByTestId('eye-icon-button'));

    await waitFor(() => {
      expect(props.onReveal).toHaveBeenCalled();
    });
  });

  it('calls onClear when trash icon is pressed', () => {
    const { props } = renderApiKeyRow({ hasProviderKey: true });

    fireEvent.press(screen.getByTestId('clear-key-button'));

    expect(props.onClear).toHaveBeenCalled();
  });
});
