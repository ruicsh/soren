import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import { ChatbotIntelligenceSection } from './ChatbotIntelligenceSection';

const DEFAULT_PROPS = {
  apiKeyDraft: '',
  hasProviderKey: false,
  modelLabel: 'GPT-4',
  modelsError: null,
  modelsLoading: false,
  onClearApiKey: vi.fn(),
  onRefreshModels: vi.fn(),
  onRevealApiKey: vi.fn().mockResolvedValue(undefined),
  onSaveApiKey: vi.fn(),
  onSelectModel: vi.fn(),
  onSelectProvider: vi.fn(),
  onUpdateApiKeyDraft: vi.fn(),
  providerLabel: 'OpenAI',
};

const renderChatbotIntelligenceSection = (overrides = {}) => {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return {
    ...render(<ChatbotIntelligenceSection {...props} />),
    props,
  };
};

describe('ChatbotIntelligenceSection', () => {
  it('renders section title', () => {
    renderChatbotIntelligenceSection();

    expect(screen.getByText('Intelligence')).toBeOnTheScreen();
  });

  it('renders provider select row with correct label and value', () => {
    const { props } = renderChatbotIntelligenceSection();

    expect(screen.getByText('Provider')).toBeOnTheScreen();
    expect(screen.getByText(props.providerLabel)).toBeOnTheScreen();
  });

  it('calls onSelectProvider when provider row is pressed', () => {
    const { props } = renderChatbotIntelligenceSection();

    fireEvent.press(screen.getByText('Provider'));

    expect(props.onSelectProvider).toHaveBeenCalled();
  });

  it('renders model select row with correct label and value', () => {
    const { props } = renderChatbotIntelligenceSection();

    expect(screen.getByText('Model')).toBeOnTheScreen();
    expect(screen.getByText(props.modelLabel)).toBeOnTheScreen();
  });

  it('calls onSelectModel when pressed', () => {
    const { props } = renderChatbotIntelligenceSection();

    fireEvent.press(screen.getByText('Model'));

    expect(props.onSelectModel).toHaveBeenCalled();
  });

  it('renders error message when modelsError exists', () => {
    const errorMessage = 'Failed to load models';
    renderChatbotIntelligenceSection({
      modelsError: errorMessage,
    });

    expect(
      screen.getByText(`${errorMessage}. Tap to retry.`),
    ).toBeOnTheScreen();
  });

  it('calls onRefreshModels when error retry is pressed', () => {
    const { props } = renderChatbotIntelligenceSection({
      modelsError: 'Error',
    });

    fireEvent.press(screen.getByText('Error. Tap to retry.'));

    expect(props.onRefreshModels).toHaveBeenCalled();
  });

  it('does not render error message when no error', () => {
    renderChatbotIntelligenceSection({
      modelsError: null,
    });

    expect(screen.queryByText(/Tap to retry/)).not.toBeOnTheScreen();
  });
});
