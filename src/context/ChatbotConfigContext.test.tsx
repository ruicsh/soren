import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Button, Text, View } from 'react-native';
import { vi } from 'vitest';

import {
  ChatbotConfigProvider,
  useChatbotConfigContext,
} from '@/context/ChatbotConfigContext';
import { loadOrCreateDefaultChatbotConfig } from '@/lib/chatbot-config';

vi.mock('@/lib/chatbot-config', () => ({
  getChatbotsRootPath: () => 'test-root/',
  loadOrCreateDefaultChatbotConfig: vi.fn(),
  saveChatbotConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/llm/models', () => ({
  fetchModels: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/hooks/use-tts', () => ({
  useTTS: () => ({ availableVoices: [] }),
}));

const TestComponent = () => {
  const { config, updateConfig } = useChatbotConfigContext();

  return (
    <View>
      <Text testID="config-name">{config?.name}</Text>
      <Text testID="config-voice">{config?.voiceId ?? 'none'}</Text>
      <Button
        onPress={() => updateConfig({ name: 'Updated Name' })}
        title="Update Name"
      />
      <Button
        onPress={() => updateConfig({ voiceId: 'voice-1' })}
        title="Update Voice"
      />
    </View>
  );
};

const AnotherComponent = () => {
  const { config } = useChatbotConfigContext();

  return (
    <View>
      <Text testID="shared-name">{config?.name}</Text>
    </View>
  );
};

describe('ChatbotConfigContext', () => {
  const mockConfig = {
    llmModel: 'model-1',
    llmProvider: 'provider-1',
    name: 'Soren',
    uuid: 'uuid-123',
    voiceId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadOrCreateDefaultChatbotConfig).mockResolvedValue(mockConfig);
  });

  it('shares state between different components', async () => {
    render(
      <ChatbotConfigProvider>
        <TestComponent />
        <AnotherComponent />
      </ChatbotConfigProvider>,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('config-name')).toHaveTextContent('Soren');
    });

    expect(screen.getByTestId('shared-name')).toHaveTextContent('Soren');

    // Update state in one component
    const updateBtn = screen.getByRole('button', { name: 'Update Name' });
    updateBtn.props.onPress(); // fireEvent.press(updateBtn)

    // Verify both reflect change
    await waitFor(() => {
      expect(screen.getByTestId('config-name')).toHaveTextContent(
        'Updated Name',
      );
    });
    expect(screen.getByTestId('shared-name')).toHaveTextContent('Updated Name');
  });

  it('reflects voice selection changes across context', async () => {
    render(
      <ChatbotConfigProvider>
        <TestComponent />
      </ChatbotConfigProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('config-voice')).toHaveTextContent('none');
    });

    const updateBtn = screen.getByRole('button', { name: 'Update Voice' });
    updateBtn.props.onPress();

    await waitFor(() => {
      expect(screen.getByTestId('config-voice')).toHaveTextContent('voice-1');
    });
  });
});
