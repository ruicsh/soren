import { render, screen } from '@testing-library/react-native';

import {
  ChatbotIdentitySection,
  type ChatbotIdentitySectionProps,
} from './ChatbotIdentitySection';

const DEFAULT_PROPS: ChatbotIdentitySectionProps = {
  uuid: 'test-uuid-123',
};

function renderChatbotIdentitySection(
  overrides: Partial<ChatbotIdentitySectionProps> = {},
) {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<ChatbotIdentitySection {...props} />);
}

describe('ChatbotIdentitySection', () => {
  it('renders section title', () => {
    renderChatbotIdentitySection();
    expect(screen.getByText('Identification')).toBeTruthy();
  });

  it('renders uuid value', () => {
    renderChatbotIdentitySection({ uuid: 'custom-uuid-456' });
    expect(screen.getByText('custom-uuid-456')).toBeTruthy();
  });

  it('renders uuid text as selectable', () => {
    renderChatbotIdentitySection({ uuid: 'selectable-uuid' });
    const uuidText = screen.getByText('selectable-uuid');
    expect(uuidText.props.selectable).toBe(true);
  });
});
