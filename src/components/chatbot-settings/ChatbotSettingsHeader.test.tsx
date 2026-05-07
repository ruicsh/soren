import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { vi } from 'vitest';

import {
  ChatbotSettingsHeader,
  type ChatbotSettingsHeaderProps,
} from './ChatbotSettingsHeader';

const DEFAULT_PROPS: ChatbotSettingsHeaderProps = {
  isCreateMode: false,
  isSaving: false,
  onBack: vi.fn(),
  onCreate: vi.fn(),
};

function renderChatbotSettingsHeader(
  overrides: Partial<ChatbotSettingsHeaderProps> = {},
) {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<ChatbotSettingsHeader {...props} />);
}

describe('ChatbotSettingsHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders back button', () => {
    renderChatbotSettingsHeader();

    expect(screen.getByLabelText('Go back')).toBeTruthy();
  });

  it('renders title in settings mode', () => {
    renderChatbotSettingsHeader({ isCreateMode: false });

    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders title in create mode', () => {
    renderChatbotSettingsHeader({ isCreateMode: true });

    expect(screen.getByText('New Chatbot')).toBeTruthy();
  });

  it('renders create button in create mode', () => {
    renderChatbotSettingsHeader({ isCreateMode: true });

    expect(screen.getByText('Create')).toBeTruthy();
  });

  it('shows activity indicator when saving in create mode', () => {
    renderChatbotSettingsHeader({ isCreateMode: true, isSaving: true });

    expect(screen.queryByText('Create')).toBeNull();
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('calls onBack when back button is pressed', () => {
    const mockOnBack = vi.fn();
    renderChatbotSettingsHeader({ onBack: mockOnBack });

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onCreate when create button is pressed', () => {
    const mockOnCreate = vi.fn();
    renderChatbotSettingsHeader({
      isCreateMode: true,
      onCreate: mockOnCreate,
    });

    fireEvent.press(screen.getByText('Create'));

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it('does not render create button in settings mode', () => {
    renderChatbotSettingsHeader({ isCreateMode: false });

    expect(screen.queryByText('Create')).toBeNull();
  });
});
