import { act, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Button, Text, View } from 'react-native';
import { vi } from 'vitest';

import {
  ChatbotConfigProvider,
  useChatbotConfigContext,
} from '@/context/ChatbotConfigContext';
import { getApiKey, setApiKey } from '@/lib/byok-keys';
import { loadOrCreateDefaultChatbotConfig } from '@/lib/chatbot-config';

vi.mock('@/lib/chatbot-config', () => ({
  getChatbotsRootPath: () => 'test-root/',
  loadOrCreateDefaultChatbotConfig: vi.fn(),
  saveChatbotConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/llm/models', () => ({
  fetchModels: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/lib/byok-keys', () => ({
  deleteApiKey: vi.fn(() => Promise.resolve()),
  getApiKey: vi.fn(() => Promise.resolve(null)),
  setApiKey: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/hooks/use-tts', () => ({
  useTTS: () => ({ availableVoices: [] }),
}));

const TestComponent = () => {
  const {
    apiKeyDraft,
    config,
    revealKey,
    save,
    updateApiKeyDraft,
    updateConfig,
  } = useChatbotConfigContext();

  return (
    <View>
      <Text testID="config-name">{config?.name}</Text>
      <Text testID="config-voice">{config?.voiceId ?? 'none'}</Text>
      <Text testID="api-key-draft">{apiKeyDraft}</Text>
      <Button
        onPress={() => updateConfig({ name: 'Updated Name' })}
        title="Update Name"
      />
      <Button
        onPress={() => updateConfig({ voiceId: 'voice-1' })}
        title="Update Voice"
      />
      <Button
        onPress={() => updateApiKeyDraft('new-draft-key')}
        title="Update Key Draft"
      />
      <Button onPress={() => revealKey()} title="Reveal Key" />
      <Button onPress={() => save()} title="Save" />
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
    act(() => {
      updateBtn.props.onPress();
    });

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
    act(() => {
      updateBtn.props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId('config-voice')).toHaveTextContent('voice-1');
    });
  });

  it('manages API key draft and reveal', async () => {
    vi.mocked(getApiKey).mockResolvedValue('stored-key');

    render(
      <ChatbotConfigProvider>
        <TestComponent />
      </ChatbotConfigProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('api-key-draft')).toHaveTextContent(''),
    );

    const updateDraftBtn = screen.getByRole('button', {
      name: 'Update Key Draft',
    });
    act(() => {
      updateDraftBtn.props.onPress();
    });
    expect(screen.getByTestId('api-key-draft')).toHaveTextContent(
      'new-draft-key',
    );

    const revealBtn = screen.getByRole('button', { name: 'Reveal Key' });
    await act(async () => {
      revealBtn.props.onPress();
    });

    await waitFor(() => {
      expect(screen.getByTestId('api-key-draft')).toHaveTextContent(
        'stored-key',
      );
    });
  });

  it('saves API key to secure store and clears draft', async () => {
    render(
      <ChatbotConfigProvider>
        <TestComponent />
      </ChatbotConfigProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('api-key-draft')).toHaveTextContent(''),
    );

    const updateDraftBtn = screen.getByRole('button', {
      name: 'Update Key Draft',
    });
    act(() => {
      updateDraftBtn.props.onPress();
    });

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await act(async () => {
      saveBtn.props.onPress();
    });

    expect(setApiKey).toHaveBeenCalledWith(
      mockConfig.uuid,
      mockConfig.llmProvider,
      'new-draft-key',
    );
    expect(screen.getByTestId('api-key-draft')).toHaveTextContent('');
  });
});
