import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

export interface ChatbotConfig {
  lastConversationAt?: number;
  lastConversationSnippet?: string;
  llmModel: string;
  llmProvider: string;
  name: string;
  providerKeyStatus?: Record<string, boolean>;
  uuid: string;
  voiceId: null | string;
}

const DEFAULT_NAME = 'Soren';
const DEFAULT_PROVIDER = 'groq';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export const getChatbotsRootPath = () => Paths.document.uri + 'chatbots/';

export const getChatbotConfigPath = (uuid: string) =>
  `${getChatbotsRootPath()}${uuid}/config.json`;

export async function loadOrCreateDefaultChatbotConfig(): Promise<ChatbotConfig> {
  const root = new Directory(Paths.document, 'chatbots');

  if (!root.exists) {
    root.create({ idempotent: true, intermediates: true });
  }

  const contents = root.list();
  const botDirs = contents.filter(
    (item): item is Directory => item instanceof Directory,
  );

  if (botDirs.length > 0) {
    const botDir = botDirs[0];
    const configFile = new File(botDir, 'config.json');
    if (configFile.exists) {
      try {
        const content = await configFile.text();
        const parsed = JSON.parse(content) as Partial<ChatbotConfig>;

        // Migration/Defaults
        return {
          lastConversationAt: parsed.lastConversationAt,
          lastConversationSnippet: parsed.lastConversationSnippet,
          llmModel: parsed.llmModel ?? DEFAULT_MODEL,
          llmProvider: parsed.llmProvider ?? DEFAULT_PROVIDER,
          name: parsed.name ?? DEFAULT_NAME,
          uuid: parsed.uuid ?? Crypto.randomUUID(),
          voiceId: parsed.voiceId ?? null,
        };
      } catch (err) {
        console.warn('Failed to load bot config, recreating:', err);
      }
    }
  }

  // Create new default bot
  const uuid = Crypto.randomUUID();
  const config: ChatbotConfig = {
    llmModel: DEFAULT_MODEL,
    llmProvider: DEFAULT_PROVIDER,
    name: DEFAULT_NAME,
    uuid,
    voiceId: null,
  };

  await saveChatbotConfig(config);

  return config;
}

export async function saveChatbotConfig(config: ChatbotConfig) {
  const botDir = new Directory(Paths.document, 'chatbots', config.uuid);
  const root = new Directory(Paths.document, 'chatbots');
  if (!root.exists) {
    root.create({ idempotent: true, intermediates: true });
  }
  if (!botDir.exists) {
    botDir.create({ idempotent: true, intermediates: true });
  }

  const configFile = new File(botDir, 'config.json');
  configFile.write(JSON.stringify(config, null, 2));
}
