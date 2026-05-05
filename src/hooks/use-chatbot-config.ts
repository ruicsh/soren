import { useCallback, useEffect, useState } from 'react';

import { useTTS } from '@/hooks/use-tts';
import {
  ChatbotConfig,
  loadOrCreateDefaultChatbotConfig,
  saveChatbotConfig,
} from '@/lib/chatbot-config';

export function useChatbotConfig() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { availableVoices } = useTTS();

  useEffect(() => {
    loadOrCreateDefaultChatbotConfig()
      .then(setConfig)
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const updateConfig = useCallback((updates: Partial<ChatbotConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

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
    availableVoices,
    config,
    error,
    isLoading,
    isSaving,
    save,
    updateConfig,
  };
}
