import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import {
  ChatbotProfileSection,
  type ChatbotProfileSectionProps,
} from './ChatbotProfileSection';

const DEFAULT_PROPS: ChatbotProfileSectionProps = {
  onSelectPersonality: vi.fn(),
  onSelectVoice: vi.fn(),
  personalityLabel: 'Default Personality',
  voiceLabel: 'Default Voice',
};

function renderChatbotProfileSection(
  overrides: Partial<ChatbotProfileSectionProps> = {},
) {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<ChatbotProfileSection {...props} />);
}

describe('ChatbotProfileSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section title', () => {
    renderChatbotProfileSection();

    expect(screen.getByText('Chatbot Profile')).toBeTruthy();
  });

  it('renders voice label', () => {
    renderChatbotProfileSection({ voiceLabel: 'Custom Voice' });

    expect(screen.getByText('Custom Voice')).toBeTruthy();
  });

  it('renders voice label with default value', () => {
    renderChatbotProfileSection();

    expect(screen.getByText('Default Voice')).toBeTruthy();
  });

  it('calls onSelectVoice when voice row is pressed', () => {
    const mockOnSelectVoice = vi.fn();
    renderChatbotProfileSection({ onSelectVoice: mockOnSelectVoice });

    fireEvent.press(screen.getByText('Voice'));

    expect(mockOnSelectVoice).toHaveBeenCalledTimes(1);
  });
});
