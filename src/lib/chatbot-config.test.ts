import { Directory, File } from 'expo-file-system';
import { vi } from 'vitest';

import {
  loadChatMessagesForDate,
  loadLatestAvailableChatMessages,
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
      avatarConfig: null,
      lastConversationAt: 123456789,
      llmModel: 'm1',
      llmProvider: 'p1',
      name: 'Bot',
      systemPrompt: 'persona',
      uuid: 'u1',
      voiceId: null,
    };

    await saveChatbotConfig(config);

    expect(File.prototype.write).toHaveBeenCalledWith(
      JSON.stringify(config, null, 2),
    );
  });

  it('saves config to correct path', async () => {
    const config = {
      avatarConfig: null,
      llmModel: 'llama-3.1-70b-versatile',
      llmProvider: 'groq',
      name: 'New Name',
      systemPrompt: 'prompt',
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

  describe('loadChatMessagesForDate', () => {
    it('returns empty array if file does not exist', async () => {
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(false);
      const messages = await loadChatMessagesForDate('u1');
      expect(messages).toEqual([]);
    });

    it('parses multiline messages that were broken across lines (legacy support)', async () => {
      const mockMarkdown = `## 22:45:33
- [22:45:33] User: Who is king?
- [22:45:33] Assistant: HTTP 429: {
    "error": {
        "message": "quota"
    }
}
`;
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(File.prototype, 'text').mockResolvedValue(mockMarkdown);

      const messages = await loadChatMessagesForDate('u1');

      expect(messages).toHaveLength(2);
      expect(messages[1].content).toContain('HTTP 429: {');
      expect(messages[1].content).toContain('"error": {');
      expect(messages[1].content).toContain('"message": "quota"');
    });
  });

  describe('loadLatestAvailableChatMessages', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns empty array if chats directory does not exist', async () => {
      vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(false);
      const messages = await loadLatestAvailableChatMessages('u1');
      expect(messages).toEqual([]);
    });

    it('loads messages from lastConversationAt date when file exists and has messages', async () => {
      const mockMarkdown = `## 14:30:00
- [14:30:00] User: Hello
- [14:30:00] Assistant: Hi there
`;
      const lastConversationAt = new Date('2024-05-07T14:30:00').getTime();

      vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(File.prototype, 'text').mockResolvedValue(mockMarkdown);

      const messages = await loadLatestAvailableChatMessages(
        'u1',
        lastConversationAt,
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].content).toBe('Hi there');
    });

    it('falls back to latest available date file when lastConversationAt file is missing', async () => {
      // Mock chats directory listing with multiple date files
      const mockFiles = [
        new File('chatbots', 'u1', 'chats', '20240506.md'),
        new File('chatbots', 'u1', 'chats', '20240507.md'),
        new File('chatbots', 'u1', 'chats', '20240508.md'),
      ];

      const mockMarkdown = `## 15:45:00
- [15:45:00] User: Earlier message
- [15:45:00] Assistant: Earlier response
`;

      const lastConversationAt = new Date('2024-05-09T10:00:00').getTime(); // Non-existent date

      vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(Directory.prototype, 'list').mockReturnValue(mockFiles as any);
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false); // lastConversationAt file missing
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(true); // 20240508.md exists
      vi.spyOn(File.prototype, 'text').mockResolvedValue(mockMarkdown);

      const messages = await loadLatestAvailableChatMessages(
        'u1',
        lastConversationAt,
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Earlier message');
    });

    it('falls back to latest available date file when lastConversationAt file exists but has no messages', async () => {
      // Mock empty file for lastConversationAt date
      const mockFiles = [new File('chatbots', 'u1', 'chats', '20240508.md')];

      const mockMarkdown = `## 16:00:00
- [16:00:00] User: Fallback message
- [16:00:00] Assistant: Fallback response
`;

      const lastConversationAt = new Date('2024-05-09T10:00:00').getTime();

      vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(Directory.prototype, 'list').mockReturnValue(mockFiles as any);
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(true); // lastConversationAt file exists but empty
      vi.spyOn(File.prototype, 'text').mockResolvedValueOnce(''); // Empty content
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(true); // 20240508.md exists
      vi.spyOn(File.prototype, 'text').mockResolvedValue(mockMarkdown);

      const messages = await loadLatestAvailableChatMessages(
        'u1',
        lastConversationAt,
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Fallback message');
    });

    it('ignores non-date filename patterns and only considers YYYYMMDD.md files', async () => {
      const mockFiles = [
        new File('chatbots', 'u1', 'chats', 'backup.md'),
        new File('chatbots', 'u1', 'chats', '20240508.md'),
        new File('chatbots', 'u1', 'chats', 'notes.txt'),
      ];

      const mockMarkdown = `## 17:00:00
- [17:00:00] User: Valid message
- [17:00:00] Assistant: Valid response
`;

      vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(Directory.prototype, 'list').mockReturnValue(mockFiles as any);
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(File.prototype, 'text').mockResolvedValue(mockMarkdown);

      const messages = await loadLatestAvailableChatMessages('u1');

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('Valid message');
    });

    it('returns empty array when no valid date files exist', async () => {
      const mockFiles = [
        new File('chatbots', 'u1', 'chats', 'backup.md'),
        new File('chatbots', 'u1', 'chats', 'notes.txt'),
      ];

      vi.spyOn(Directory.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(Directory.prototype, 'list').mockReturnValue(mockFiles as any);

      const messages = await loadLatestAvailableChatMessages('u1');

      expect(messages).toEqual([]);
    });
  });

  describe('resolveMemoryText', () => {
    it('resolves text from multiple pointers and deduplicates file reads', async () => {
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(true);
      vi.spyOn(File.prototype, 'text')
        .mockResolvedValueOnce(
          '## 12:00:00\n- [12:00:00] User: u1\n- [12:00:00] Assistant: a1',
        )
        .mockResolvedValueOnce(
          '## 13:00:00\n- [13:00:00] User: u2\n- [13:00:00] Assistant: a2',
        );

      const { resolveMemoryText } = await import('./chatbot-config');
      const pointers = [
        { dateKey: '20240508', timeKey: '12:00:00' },
        { dateKey: '20240508', timeKey: '12:00:00' }, // Duplicate hit
        { dateKey: '20240509', timeKey: '13:00:00' },
      ];

      const resolved = await resolveMemoryText('uuid', pointers);

      expect(resolved).toHaveLength(3);
      expect(resolved[0]).toBe('User: u1\nAssistant: a1');
      expect(resolved[1]).toBe('User: u1\nAssistant: a1');
      expect(resolved[2]).toBe('User: u2\nAssistant: a2');
      // Verify loadChatMessagesForDate (via File.text) was called only twice due to cache
      expect(File.prototype.text).toHaveBeenCalledTimes(2);
    });

    it('skips missing files or missing timeKeys', async () => {
      vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(false);

      const { resolveMemoryText } = await import('./chatbot-config');
      const pointers = [{ dateKey: '20240508', timeKey: '12:00:00' }];
      const resolved = await resolveMemoryText('uuid', pointers);

      expect(resolved).toHaveLength(0);
    });
  });
});
