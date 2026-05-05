import { useCallback, useEffect, useState } from 'react';

import { useTTS } from '@/hooks/use-tts';
import {
  ChatbotConfig,
  loadOrCreateDefaultChatbotConfig,
  saveChatbotConfig,
} from '@/lib/chatbot-config';
import { PROVIDERS } from '@/lib/llm/catalog';
import { fetchModels, LLMModel } from '@/lib/llm/models';

export function useChatbotConfig() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<null | string>(null);

  const { availableVoices } = useTTS();

  const refreshModels = useCallback(async (providerId: string) => {
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
        refreshModels(cfg.llmProvider);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setIsLoading(false));
  }, [refreshModels]);

  const updateConfig = useCallback(
    (updates: Partial<ChatbotConfig>) => {
      setConfig((prev) => {
        if (!prev) return null;
        const next = { ...prev, ...updates };

        // If provider changed, refresh models and auto-pick default
        if (updates.llmProvider && updates.llmProvider !== prev.llmProvider) {
          const entry = PROVIDERS.find((p) => p.id === updates.llmProvider);
          if (entry) {
            next.llmModel = entry.defaultModel;
            refreshModels(entry.id);
          }
        }

        return next;
      });
    },
    [refreshModels],
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

  return {
    availableModels,
    availableProviders: PROVIDERS,
    availableVoices,
    config,
    error,
    isLoading,
    isSaving,
    modelsError,
    modelsLoading,
    refreshModels: () => config && refreshModels(config.llmProvider),
    save,
    updateConfig,
  };
}
