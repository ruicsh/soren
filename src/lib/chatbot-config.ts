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

export interface ChatTurn {
  assistantText: string;
  timestamp: number;
  userText: string;
  uuid: string;
}

const DEFAULT_NAME = 'Soren';
const DEFAULT_PROVIDER = 'groq';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export const getChatbotsRootPath = () => Paths.document.uri + 'chatbots/';

export const getChatbotConfigPath = (uuid: string) =>
  `${getChatbotsRootPath()}${uuid}/config.json`;

export async function appendChatTurn(turn: ChatTurn) {
  const { assistantText, timestamp, userText, uuid } = turn;
  const date = new Date(timestamp);
  const YYYYMMDD = date.toISOString().split('T')[0].replace(/-/g, '');
  const HHmmss = date.toTimeString().split(' ')[0];

  const chatsDir = new Directory(Paths.document, 'chatbots', uuid, 'chats');
  if (!chatsDir.exists) {
    chatsDir.create({ idempotent: true, intermediates: true });
  }

  const chatFile = new File(chatsDir, `${YYYYMMDD}.md`);
  const exists = chatFile.exists;

  let content = '';
  if (!exists) {
    content += `# Chat ${date.toLocaleDateString()}\n\n`;
  }

  content += `## ${HHmmss}\n`;
  content += `- [${HHmmss}] User: ${userText}\n`;
  content += `- [${HHmmss}] Assistant: ${assistantText}\n\n`;

  if (exists) {
    const old = await chatFile.text();
    chatFile.write(old + content);
  } else {
    chatFile.write(content);
  }

  // Also ensure MEMORY.md exists
  const memoryFile = new File(Paths.document, 'chatbots', uuid, 'MEMORY.md');
  if (!memoryFile.exists) {
    memoryFile.write(`# Memory - ${uuid}\n\n`);
  }
}

export async function deleteChatbot(uuid: string) {
  const botDir = new Directory(Paths.document, 'chatbots', uuid);
  if (botDir.exists) {
    botDir.delete();
  }
}

export async function listChatbotConfigs(): Promise<ChatbotConfig[]> {
  const root = new Directory(Paths.document, 'chatbots');

  if (!root.exists) {
    root.create({ idempotent: true, intermediates: true });

    return [];
  }

  const contents = root.list();
  const configs: ChatbotConfig[] = [];

  for (const item of contents) {
    if (item instanceof Directory) {
      const configFile = new File(item, 'config.json');
      if (configFile.exists) {
        try {
          const content = await configFile.text();
          const parsed = JSON.parse(content) as ChatbotConfig;

          // Migration/Defaults
          configs.push({
            lastConversationAt: parsed.lastConversationAt,
            lastConversationSnippet: parsed.lastConversationSnippet,
            llmModel: parsed.llmModel ?? DEFAULT_MODEL,
            llmProvider: parsed.llmProvider ?? DEFAULT_PROVIDER,
            name: parsed.name ?? DEFAULT_NAME,
            providerKeyStatus: parsed.providerKeyStatus,
            uuid: parsed.uuid,
            voiceId: parsed.voiceId ?? null,
          });
        } catch (err) {
          console.warn(`Failed to load config for ${item.uri}:`, err);
        }
      }
    }
  }

  return configs.sort(
    (a, b) => (b.lastConversationAt ?? 0) - (a.lastConversationAt ?? 0),
  );
}

export async function loadChatbotConfig(
  uuid: string,
): Promise<ChatbotConfig | null> {
  const configFile = new File(getChatbotConfigPath(uuid));
  if (!configFile.exists) return null;

  try {
    const content = await configFile.text();

    return JSON.parse(content) as ChatbotConfig;
  } catch (err) {
    console.warn(`Failed to load config for ${uuid}:`, err);

    return null;
  }
}

export async function loadOrCreateDefaultChatbotConfig(): Promise<ChatbotConfig> {
  const configs = await listChatbotConfigs();

  if (configs.length > 0) {
    return configs[0];
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
