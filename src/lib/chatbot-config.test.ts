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
  });

  it('loads existing config', async () => {
    const existingConfig = {
      name: 'Custom Bot',
      uuid: 'existing-uuid',
      voiceId: 'voice-1',
    };

    const mockBotDir = new Directory('chatbots', 'existing-uuid');
    vi.spyOn(Directory.prototype, 'list').mockReturnValue([mockBotDir as any]);

    // Use mockImplementation to avoid issues with spyOn prototype
    vi.mocked(File.prototype.text).mockResolvedValue(
      JSON.stringify(existingConfig),
    );

    const config = await loadOrCreateDefaultChatbotConfig();

    expect(config.name).toBe('Custom Bot');
    expect(config.uuid).toBe('existing-uuid');
  });

  it('saves config to correct path', async () => {
    const config = {
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
