import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { NiceAvatarConfig } from '@/components/chatbot-avatar/avatar-bw';
import type { ChatMessage } from '@/lib/llm/types';

import { sanitizeAssistantContent } from '@/lib/llm/sanitize';

export interface ChatbotConfig {
  avatarConfig: NiceAvatarConfig | null;
  lastConversationAt?: number;
  lastConversationSnippet?: string;
  llmModel: string;
  llmProvider: string;
  name: string;
  providerKeyStatus?: Record<string, boolean>;
  systemPrompt: string;
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
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful, direct, and thoughtful assistant. Be concise and honest. Don't be sycophantic — skip the affirmations and get to the point. If you don't know something, say so.";

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
            avatarConfig: parsed.avatarConfig ?? null,
            lastConversationAt: parsed.lastConversationAt,
            lastConversationSnippet: parsed.lastConversationSnippet,
            llmModel: parsed.llmModel ?? DEFAULT_MODEL,
            llmProvider: parsed.llmProvider ?? DEFAULT_PROVIDER,
            name: parsed.name ?? DEFAULT_NAME,
            providerKeyStatus: parsed.providerKeyStatus,
            systemPrompt: parsed.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
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
        const [, hh, mm, ss, roleStr, content] = match;
        const msgDate = new Date(baseDate);
        msgDate.setHours(parseInt(hh, 10), parseInt(mm, 10), parseInt(ss, 10));

        const role = roleStr.toLowerCase() as 'assistant' | 'user';
        currentMsg = {
          content:
            role === 'assistant'
              ? sanitizeAssistantContent(content.replace(/<br\/>/g, '\n'))
              : content.replace(/<br\/>/g, '\n'),
          id: `${msgDate.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
          role,
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

        if (currentMsg.role === 'assistant') {
          currentMsg.content = sanitizeAssistantContent(currentMsg.content);
        }
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
    avatarConfig: null,
    llmModel: DEFAULT_MODEL,
    llmProvider: DEFAULT_PROVIDER,
    name: DEFAULT_NAME,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    uuid,
    voiceId: null,
  };

  await saveChatbotConfig(config);

  return config;
}

export async function resolveMemoryText(
  uuid: string,
  pointers: { dateKey: string; timeKey: string }[],
): Promise<string[]> {
  const resolved: string[] = [];
  const fileCache = new Map<string, ChatMessage[]>();

  for (const { dateKey, timeKey } of pointers) {
    try {
      let messages = fileCache.get(dateKey);

      if (!messages) {
        // Parse YYYYMMDD string back to Date
        const year = parseInt(dateKey.slice(0, 4), 10);
        const month = parseInt(dateKey.slice(4, 6), 10) - 1;
        const day = parseInt(dateKey.slice(6, 8), 10);
        const date = new Date(year, month, day);

        messages = await loadChatMessagesForDate(uuid, date);
        fileCache.set(dateKey, messages);
      }

      // Find user/assistant pair matching the timeKey
      // We search for the user message at this timeKey, and then the next assistant message.
      // But in our format, both have the same timeKey header in the markdown.
      // loadChatMessagesForDate already parses them into separate messages with timestamps.
      // We can reconstruct HH:mm:ss from message.timestamp.
      const pair = messages.filter((m) => {
        if (m.timestamp === undefined) return false;
        const d = new Date(m.timestamp);
        const hhmmss = d.toTimeString().split(' ')[0];

        return hhmmss === timeKey;
      });

      const user = pair.find((m) => m.role === 'user');
      const assistant = pair.find((m) => m.role === 'assistant');

      if (user && assistant) {
        resolved.push(`User: ${user.content}\nAssistant: ${assistant.content}`);
      }
    } catch (err) {
      console.warn(
        `[Memory] Failed to resolve text for ${dateKey} ${timeKey}:`,
        err,
      );
    }
  }

  return resolved;
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
