import { Directory, File } from 'expo-file-system';
import { vi } from 'vitest';

import {
  loadOrCreateDefaultChatbotConfig,
  saveChatbotConfig,
} from './chatbot-config';

describe('chatbot-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates default config if none exists', async () => {
    // Mock root.list = []
    vi.spyOn(Directory.prototype, 'list').mockReturnValue([]);

    const config = await loadOrCreateDefaultChatbotConfig();

    expect(config.name).toBe('Soren');
    expect(config.uuid).toBe('test-uuid-1234');
    expect(config.voiceId).toBeNull();
    expect(config.llmProvider).toBe('groq');
    expect(config.llmModel).toBe('llama-3.1-8b-instant');
  });

  it('loads existing config and applies migration defaults', async () => {
    const legacyConfig = {
      name: 'Custom Bot',
      uuid: 'existing-uuid',
      voiceId: 'voice-1',
    };

    const mockBotDir = new Directory('chatbots', 'existing-uuid');
    vi.spyOn(Directory.prototype, 'list').mockReturnValue([mockBotDir as any]);

    // Use mockImplementation to avoid issues with spyOn prototype
    vi.mocked(File.prototype.text).mockResolvedValue(
      JSON.stringify(legacyConfig),
    );

    const config = await loadOrCreateDefaultChatbotConfig();

    expect(config.name).toBe('Custom Bot');
    expect(config.uuid).toBe('existing-uuid');
    expect(config.llmProvider).toBe('groq');
    expect(config.llmModel).toBe('llama-3.1-8b-instant');
  });

  it('persists lastConversationAt', async () => {
    const config = {
      llmModel: 'm1',
      llmProvider: 'p1',
      name: 'Bot',
      uuid: 'u1',
      voiceId: null,
      lastConversationAt: 123456789,
    };

    await saveChatbotConfig(config);

    expect(File.prototype.write).toHaveBeenCalledWith(
      JSON.stringify(config, null, 2),
    );
  });

  it('saves config to correct path', async () => {
    const config = {
      llmModel: 'llama-3.1-70b-versatile',
      llmProvider: 'groq',
      name: 'New Name',
      uuid: 'uuid-to-save',
      voiceId: 'voice-2',
    };

    // Ensure exists is false so create() is called
    vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(false);

    await saveChatbotConfig(config);

    expect(Directory.prototype.create).toHaveBeenCalled();
    expect(File.prototype.write).toHaveBeenCalledWith(
      JSON.stringify(config, null, 2),
    );
  });
});
