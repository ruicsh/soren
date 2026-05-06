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
  ChatbotConfig,
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
  clearProviderApiKey: () => void;
  config: ChatbotConfig | null;
  error: null | string;
  hasProviderKey: boolean;
  isLoading: boolean;
  isSaving: boolean;
  modelsError: null | string;
  modelsLoading: boolean;
  refreshModels: () => void;
  revealKey: () => Promise<void>;
  save: () => Promise<void>;
  updateApiKeyDraft: (key: string) => void;
  updateConfig: (updates: Partial<ChatbotConfig>) => void;
  updateLastConversation: (snippet: string) => void;
  updateLastConversationAt: () => void;
}

const ChatbotConfigContext = createContext<ChatbotConfigContextType | null>(
  null,
);

export function ChatbotConfigProvider(props: PropsWithChildren) {
  const { children } = props;

  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<null | string>(null);

  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [hasProviderKey, setHasProviderKey] = useState(false);

  const { availableVoices } = useTTS();

  const fetchModelsForProvider = useCallback(
    async (providerId: string, apiKey?: string) => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        // Use provided key or try to load from secure store
        let key = apiKey;
        if (!key && config?.uuid) {
          key = (await getApiKey(config.uuid, providerId)) || undefined;
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
    [config?.uuid],
  );

  useEffect(() => {
    loadOrCreateDefaultChatbotConfig()
      .then(async (cfg) => {
        setConfig(cfg);
        const hasKey = !!(await getApiKey(cfg.uuid, cfg.llmProvider));
        setHasProviderKey(hasKey);
        fetchModelsForProvider(cfg.llmProvider);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setIsLoading(false));
  }, [fetchModelsForProvider]);

  const updateConfig = useCallback(
    (updates: Partial<ChatbotConfig>) => {
      setConfig((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...updates };

        if (updates.llmProvider && updates.llmProvider !== prev.llmProvider) {
          const entry = PROVIDERS.find((p) => p.id === updates.llmProvider);
          if (entry) {
            next.llmModel = entry.defaultModel;
            setApiKeyDraft('');
            getApiKey(prev.uuid, entry.id).then((key) => {
              setHasProviderKey(!!key);
              fetchModelsForProvider(entry.id, key || undefined);
            });
          }
        }

        return next;
      });
    },
    [fetchModelsForProvider],
  );

  const updateLastConversationAt = useCallback(() => {
    if (!config) return;
    const now = Date.now();
    updateConfig({ lastConversationAt: now });
    saveChatbotConfig({ ...config, lastConversationAt: now });
  }, [config, updateConfig]);

  const updateLastConversation = useCallback(
    (snippet: string) => {
      if (!config) return;
      const now = Date.now();
      const firstSentence =
        snippet.split(/[.!?]/).find((s) => s.trim().length > 0)?.trim() ||
        snippet.trim();
      const finalSnippet =
        firstSentence.length > 60
          ? firstSentence.slice(0, 57) + '...'
          : firstSentence;

      updateConfig({
        lastConversationAt: now,
        lastConversationSnippet: finalSnippet,
      });
      saveChatbotConfig({
        ...config,
        lastConversationAt: now,
        lastConversationSnippet: finalSnippet,
      });
    },
    [config, updateConfig],
  );

  const save = useCallback(async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      if (apiKeyDraft) {
        await setApiKey(config.uuid, config.llmProvider, apiKeyDraft);
        setHasProviderKey(true);
        setApiKeyDraft('');

        // Update config status map
        const status = { ...config.providerKeyStatus };
        status[config.llmProvider] = true;
        config.providerKeyStatus = status;

        // Refresh models now that we have a key
        fetchModelsForProvider(config.llmProvider, apiKeyDraft);
      }

      await saveChatbotConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [config, apiKeyDraft, fetchModelsForProvider]);

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
        clearProviderApiKey,
        config,
        error,
        hasProviderKey,
        isLoading,
        isSaving,
        modelsError,
        modelsLoading,
        refreshModels,
        revealKey,
        save,
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
