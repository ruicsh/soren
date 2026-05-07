import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { ChatMessage } from '@/lib/llm/types';

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

  const safeUserText = userText.replace(/\n/g, '<br/>');
  const safeAssistantText = assistantText.replace(/\n/g, '<br/>');

  content += `## ${HHmmss}\n`;
  content += `- [${HHmmss}] User: ${safeUserText}\n`;
  content += `- [${HHmmss}] Assistant: ${safeAssistantText}\n\n`;

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

export async function loadChatMessagesForDate(
  uuid: string,
  date: Date = new Date(),
): Promise<ChatMessage[]> {
  const YYYYMMDD = date.toISOString().split('T')[0].replace(/-/g, '');
  const chatFile = new File(
    Paths.document,
    'chatbots',
    uuid,
    'chats',
    `${YYYYMMDD}.md`,
  );

  if (!chatFile.exists) return [];

  try {
    const text = await chatFile.text();
    const lines = text.split('\n');
    const messages: ChatMessage[] = [];

    // Base year/month/day from the date object
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    let currentMsg: ChatMessage | null = null;

    for (const line of lines) {
      // Pattern: - [HH:mm:ss] Role: Content
      const match = line.match(
        /^- \[(\d{2}):(\d{2}):(\d{2})\] (User|Assistant): (.*)$/,
      );
      if (match) {
        const [, hh, mm, ss, role, content] = match;
        const msgDate = new Date(baseDate);
        msgDate.setHours(parseInt(hh, 10), parseInt(mm, 10), parseInt(ss, 10));

        currentMsg = {
          content: content.replace(/<br\/>/g, '\n'),
          id: `${msgDate.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
          role: role.toLowerCase() as 'assistant' | 'user',
          timestamp: msgDate.getTime(),
        };
        messages.push(currentMsg);
      } else if (
        currentMsg &&
        line.trim().length > 0 &&
        !line.startsWith('#')
      ) {
        // Append to current message if it's a continuation line
        // (Removing leading spaces/dashes if any from manual edits or broken saves)
        const addition = line.replace(/^\s+/, '').replace(/<br\/>/g, '\n');
        currentMsg.content += '\n' + addition;
      }
    }

    return messages;
  } catch (err) {
    console.warn(
      `Failed to load chat messages for ${uuid} on ${YYYYMMDD}:`,
      err,
    );

    return [];
  }
}

export async function loadLatestAvailableChatMessages(
  uuid: string,
  lastConversationAt?: number,
): Promise<ChatMessage[]> {
  // Try to load from the last conversation date first
  if (lastConversationAt) {
    const lastDate = new Date(lastConversationAt);
    const messages = await loadChatMessagesForDate(uuid, lastDate);
    if (messages.length > 0) {
      return messages;
    }
  }

  // Fallback: find the latest available chat file
  const chatsDir = new Directory(Paths.document, 'chatbots', uuid, 'chats');
  if (!chatsDir.exists) return [];

  try {
    const items = chatsDir.list();
    const dateFiles: { date: Date; file: File }[] = [];

    for (const item of items) {
      if (item instanceof File) {
        // Match YYYYMMDD.md pattern
        const match = item.uri.match(/\/(\d{8})\.md$/);
        if (match) {
          const dateStr = match[1];
          const year = parseInt(dateStr.slice(0, 4), 10);
          const month = parseInt(dateStr.slice(4, 6), 10) - 1; // JS months are 0-based
          const day = parseInt(dateStr.slice(6, 8), 10);
          const date = new Date(year, month, day);
          dateFiles.push({ date, file: item });
        }
      }
    }

    // Sort by date descending (latest first)
    dateFiles.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Try each date file until we find one with messages
    for (const { date } of dateFiles) {
      const messages = await loadChatMessagesForDate(uuid, date);
      if (messages.length > 0) {
        return messages;
      }
    }
  } catch (err) {
    console.warn(`Failed to scan chat files for ${uuid}:`, err);
  }

  return [];
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
