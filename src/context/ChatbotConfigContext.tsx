import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useTTS } from '@/hooks/use-tts';
import { deleteApiKey, getApiKey, setApiKey } from '@/lib/byok-keys';
import {
  appendChatTurn,
  ChatbotConfig,
  deleteChatbot as deleteChatbotFs,
  listChatbotConfigs,
  loadOrCreateDefaultChatbotConfig,
  saveChatbotConfig,
} from '@/lib/chatbot-config';
import { PROVIDERS } from '@/lib/llm/catalog';
import { fetchModels, LLMModel } from '@/lib/llm/models';

interface ChatbotConfigContextType {
  apiKeyDraft: string;
  availableModels: LLMModel[];
  availableProviders: typeof PROVIDERS;
  availableVoices: any[];
  chatbots: ChatbotConfig[];
  clearProviderApiKey: () => void;
  config: ChatbotConfig | null;
  createChatbot: () => Promise<ChatbotConfig>;
  deleteChatbot: (uuid: string) => Promise<void>;
  error: null | string;
  hasProviderKey: boolean;
  isLoading: boolean;
  isSaving: boolean;
  modelsError: null | string;
  modelsLoading: boolean;
  refreshChatbots: () => Promise<ChatbotConfig[] | void>;
  refreshModels: () => void;
  revealKey: () => Promise<void>;
  save: () => Promise<void>;
  saveWithConfig: (updates: Partial<ChatbotConfig>) => Promise<void>;
  selectChatbot: (uuid: string) => void;
  updateApiKeyDraft: (key: string) => void;
  updateConfig: (updates: Partial<ChatbotConfig>) => void;
  updateLastConversation: (
    userText: string,
    assistantText: string,
  ) => Promise<void>;
  updateLastConversationAt: () => void;
}

const ChatbotConfigContext = createContext<ChatbotConfigContextType | null>(
  null,
);

export function ChatbotConfigProvider(props: PropsWithChildren) {
  const { children } = props;

  const [chatbots, setChatbots] = useState<ChatbotConfig[]>([]);
  const [activeUuid, setActiveUuid] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<null | string>(null);

  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [hasProviderKey, setHasProviderKey] = useState(false);

  const { availableVoices } = useTTS();

  const config = React.useMemo(() => {
    return chatbots.find((c) => c.uuid === activeUuid) || null;
  }, [chatbots, activeUuid]);

  const refreshChatbots = useCallback(async () => {
    try {
      const configs = await listChatbotConfigs();
      setChatbots(configs);

      return configs;
    } catch (err) {
      console.error('Failed to list chatbots:', err);

      return [];
    }
  }, []);

  const fetchModelsForProvider = useCallback(
    async (providerId: string, apiKey?: string) => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        // Use provided key or try to load from secure store
        let key = apiKey;
        if (!key && activeUuid) {
          key = (await getApiKey(activeUuid, providerId)) || undefined;
        }

        if (!key) {
          setAvailableModels([]);
          setModelsError('API Key required to fetch models');

          return;
        }

        const models = await fetchModels(providerId, key);
        setAvailableModels(models);
      } catch (err) {
        setModelsError(err instanceof Error ? err.message : String(err));
      } finally {
        setModelsLoading(false);
      }
    },
    [activeUuid],
  );

  useEffect(() => {
    let isMounted = true;

    loadOrCreateDefaultChatbotConfig()
      .then(async (cfg) => {
        const configs = await refreshChatbots();
        if (!isMounted) return;

        const initial = configs.find((c) => c.uuid === cfg.uuid) || cfg;

        setActiveUuid((prev) => {
          if (prev) {
            return prev;
          }

          return initial.uuid;
        });

        const hasKey = !!(await getApiKey(initial.uuid, initial.llmProvider));
        if (isMounted) {
          setHasProviderKey(hasKey);
          fetchModelsForProvider(initial.llmProvider);
        }
      })
      .catch((err) => {
        if (isMounted)
          setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshChatbots, fetchModelsForProvider]);

  const createChatbot = useCallback(async () => {
    const uuid = (await import('expo-crypto')).randomUUID();
    const newBot: ChatbotConfig = {
      llmModel: 'llama-3.1-8b-instant',
      llmProvider: 'groq',
      name: 'New Chatbot',
      uuid,
      voiceId: null,
    };
    await saveChatbotConfig(newBot);
    await refreshChatbots();
    setActiveUuid(uuid);

    return newBot;
  }, [refreshChatbots]);

  const deleteChatbot = useCallback(
    async (uuid: string) => {
      // Cleanup provider keys
      const bot = chatbots.find((c) => c.uuid === uuid);
      if (bot && bot.providerKeyStatus) {
        for (const pId in bot.providerKeyStatus) {
          await deleteApiKey(uuid, pId);
        }
      }

      await deleteChatbotFs(uuid);
      const remaining = await refreshChatbots();

      if (activeUuid === uuid) {
        if (remaining.length > 0) {
          setActiveUuid(remaining[0].uuid);
        } else {
          const def = await loadOrCreateDefaultChatbotConfig();
          await refreshChatbots();
          setActiveUuid(def.uuid);
        }
      }
    },
    [activeUuid, chatbots, refreshChatbots],
  );

  const selectChatbot = useCallback(
    (uuid: string) => {
      const target = chatbots.find((c) => c.uuid === uuid);
      if (target) {
        setActiveUuid(uuid);
        setApiKeyDraft('');
        getApiKey(uuid, target.llmProvider).then((key) => {
          setHasProviderKey(!!key);
          fetchModelsForProvider(target.llmProvider, key || undefined);
        });
      }
    },
    [chatbots, fetchModelsForProvider],
  );

  const updateConfig = useCallback(
    (updates: Partial<ChatbotConfig>) => {
      setChatbots((prev) => {
        return prev.map((c) => {
          if (c.uuid === activeUuid) {
            const next = { ...c, ...updates };
            if (updates.llmProvider && updates.llmProvider !== c.llmProvider) {
              const entry = PROVIDERS.find((p) => p.id === updates.llmProvider);
              if (entry) {
                next.llmModel = entry.defaultModel;
              }
            }

            return next;
          }

          return c;
        });
      });

      if (updates.llmProvider && activeUuid) {
        const entry = PROVIDERS.find((p) => p.id === updates.llmProvider);
        if (entry) {
          setApiKeyDraft('');
          getApiKey(activeUuid, entry.id).then((key) => {
            setHasProviderKey(!!key);
            fetchModelsForProvider(entry.id, key || undefined);
          });
        }
      }
    },
    [activeUuid, fetchModelsForProvider],
  );

  const saveWithConfig = useCallback(
    async (updates: Partial<ChatbotConfig>) => {
      // First, update local state for immediate UI feedback
      updateConfig(updates);

      // We need to construct the config to save based on the LATEST available data.
      // Since updateConfig just scheduled a state update, we use the closure's 'chatbots'
      // but merge the updates ourselves to be safe.
      const configToSave = chatbots.find((c) => c.uuid === activeUuid);
      if (!configToSave) return;

      const targetConfig = { ...configToSave, ...updates };

      setIsSaving(true);
      try {
        if (apiKeyDraft) {
          await setApiKey(
            targetConfig.uuid,
            targetConfig.llmProvider,
            apiKeyDraft,
          );
          setHasProviderKey(true);
          setApiKeyDraft('');

          const status = { ...targetConfig.providerKeyStatus };
          status[targetConfig.llmProvider] = true;
          targetConfig.providerKeyStatus = status;

          updateConfig({ providerKeyStatus: status });

          await saveChatbotConfig(targetConfig);
          fetchModelsForProvider(targetConfig.llmProvider, apiKeyDraft);
        } else {
          await saveChatbotConfig(targetConfig);
        }

        // Use refreshChatbots to ensure state is in sync with FS after save
        await refreshChatbots();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSaving(false);
      }
    },
    [
      activeUuid,
      apiKeyDraft,
      chatbots,
      fetchModelsForProvider,
      refreshChatbots,
      updateConfig,
    ],
  );

  const updateLastConversationAt = useCallback(() => {
    const configToSave = chatbots.find((c) => c.uuid === activeUuid);
    if (!configToSave) return;
    const now = Date.now();
    updateConfig({ lastConversationAt: now });
    saveChatbotConfig({ ...configToSave, lastConversationAt: now });
  }, [activeUuid, chatbots, updateConfig]);

  const updateLastConversation = useCallback(
    async (userText: string, assistantText: string) => {
      if (!config) return;
      const now = Date.now();
      const firstSentence =
        assistantText
          .split(/[.!?]/)
          .find((s) => s.trim().length > 0)
          ?.trim() || assistantText.trim();
      const finalSnippet =
        firstSentence.length > 60
          ? firstSentence.slice(0, 57) + '...'
          : firstSentence;

      const updated = {
        ...config,
        lastConversationAt: now,
        lastConversationSnippet: finalSnippet,
      };

      updateConfig({
        lastConversationAt: now,
        lastConversationSnippet: finalSnippet,
      });

      await appendChatTurn({
        assistantText,
        timestamp: now,
        userText,
        uuid: config.uuid,
      });

      await saveChatbotConfig(updated);
      await refreshChatbots();
    },
    [config, updateConfig, refreshChatbots],
  );

  const save = useCallback(async () => {
    await saveWithConfig({});
  }, [saveWithConfig]);

  const clearProviderApiKey = useCallback(async () => {
    if (!config) return;
    await deleteApiKey(config.uuid, config.llmProvider);
    setHasProviderKey(false);
    setApiKeyDraft('');

    const status = { ...config.providerKeyStatus };
    delete status[config.llmProvider];
    updateConfig({ providerKeyStatus: status });

    setAvailableModels([]);
    setModelsError('API Key cleared');
  }, [config, updateConfig]);

  const refreshModels = useCallback(() => {
    if (config) fetchModelsForProvider(config.llmProvider);
  }, [config, fetchModelsForProvider]);

  const revealKey = useCallback(async () => {
    if (!config) return;
    const key = await getApiKey(config.uuid, config.llmProvider);
    if (key) {
      setApiKeyDraft(key);
    }
  }, [config]);

  return (
    <ChatbotConfigContext.Provider
      value={{
        apiKeyDraft,
        availableModels,
        availableProviders: PROVIDERS,
        availableVoices,
        chatbots,
        clearProviderApiKey,
        config,
        createChatbot,
        deleteChatbot,
        error,
        hasProviderKey,
        isLoading,
        isSaving,
        modelsError,
        modelsLoading,
        refreshChatbots,
        refreshModels,
        revealKey,
        save,
        saveWithConfig,
        selectChatbot,
        updateApiKeyDraft: setApiKeyDraft,
        updateConfig,
        updateLastConversation,
        updateLastConversationAt,
      }}
    >
      {children}
    </ChatbotConfigContext.Provider>
  );
}

export function useChatbotConfigContext() {
  const context = useContext(ChatbotConfigContext);
  if (!context) {
    throw new Error(
      'useChatbotConfigContext must be used within a ChatbotConfigProvider',
    );
  }

  return context;
}
