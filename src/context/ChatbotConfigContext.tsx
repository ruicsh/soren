import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useTTS } from '@/hooks/use-tts';
import {
  ChatbotConfig,
  loadOrCreateDefaultChatbotConfig,
  saveChatbotConfig,
} from '@/lib/chatbot-config';
import { PROVIDERS } from '@/lib/llm/catalog';
import { fetchModels, LLMModel } from '@/lib/llm/models';

interface ChatbotConfigContextType {
  availableModels: LLMModel[];
  availableProviders: typeof PROVIDERS;
  availableVoices: any[];
  config: ChatbotConfig | null;
  error: null | string;
  isLoading: boolean;
  isSaving: boolean;
  modelsError: null | string;
  modelsLoading: boolean;
  refreshModels: () => void;
  save: () => Promise<void>;
  updateConfig: (updates: Partial<ChatbotConfig>) => void;
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

  const { availableVoices } = useTTS();

  const fetchModelsForProvider = useCallback(async (providerId: string) => {
    setModelsLoading(true);
    setModelsError(null);
    try {
      const models = await fetchModels(providerId);
      setAvailableModels(models);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : String(err));
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrCreateDefaultChatbotConfig()
      .then((cfg) => {
        setConfig(cfg);
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
            fetchModelsForProvider(entry.id);
          }
        }

        return next;
      });
    },
    [fetchModelsForProvider],
  );

  const save = useCallback(async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await saveChatbotConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  const refreshModels = useCallback(() => {
    if (config) fetchModelsForProvider(config.llmProvider);
  }, [config, fetchModelsForProvider]);

  return (
    <ChatbotConfigContext.Provider
      value={{
        availableModels,
        availableProviders: PROVIDERS,
        availableVoices,
        config,
        error,
        isLoading,
        isSaving,
        modelsError,
        modelsLoading,
        refreshModels,
        save,
        updateConfig,
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
