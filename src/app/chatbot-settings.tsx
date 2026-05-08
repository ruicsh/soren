import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatbotIdentitySection } from '@/components/chatbot-settings/ChatbotIdentitySection';
import { ChatbotIntelligenceSection } from '@/components/chatbot-settings/ChatbotIntelligenceSection';
import { ChatbotNameEditor } from '@/components/chatbot-settings/ChatbotNameEditor';
import { ChatbotProfileSection } from '@/components/chatbot-settings/ChatbotProfileSection';
import { ChatbotSettingsHeader } from '@/components/chatbot-settings/ChatbotSettingsHeader';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useDebounce } from '@/hooks/use-debounce';
import { useMemoryStore } from '@/hooks/use-memory-store';
import { colors, spacing, typography } from '@/theme';

export default function ChatbotSettingsScreen() {
  const { back, push, replace } = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isCreateMode = mode === 'create';

  const [nameDraft, setNameDraft] = useState('');

  const {
    apiKeyDraft,
    availableModels,
    availableProviders,
    availableVoices,
    clearProviderApiKey,
    config,
    createChatbot,
    error,
    hasProviderKey,
    isLoading,
    isSaving,
    modelsError,
    modelsLoading,
    refreshModels,
    revealKey,
    save,
    saveWithConfig,
    updateApiKeyDraft,
  } = useChatbotConfig();

  const { clear: clearMemory } = useMemoryStore(config?.uuid ?? null);

  const debouncedSaveName = useDebounce((name: string) => {
    saveWithConfig({ name });
  }, 1_000);

  const hasCreated = useRef(false);

  const handleCreate = async () => {
    await saveWithConfig({ name: nameDraft });
    replace('/');
  };

  const handleNameChange = (text: string) => {
    setNameDraft(text);
    debouncedSaveName(text);
  };

  useEffect(() => {
    if (isCreateMode && !isLoading && !hasCreated.current) {
      hasCreated.current = true;
      createChatbot();
    }
  }, [isCreateMode, isLoading, createChatbot]);

  const lastUuid = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (config?.uuid !== lastUuid.current) {
      lastUuid.current = config?.uuid;
      setNameDraft(config?.name ?? '');
    }
  }, [config?.uuid, config?.name]);

  const providerEntry = availableProviders.find(
    (p) => p.id === config?.llmProvider,
  );
  const providerLabel = providerEntry?.label ?? config?.llmProvider ?? '';

  const modelLabel =
    availableModels.find((m) => m.id === config?.llmModel)?.name ??
    config?.llmModel ??
    '';

  const voiceLabel =
    config?.voiceId === null
      ? 'Auto (Default)'
      : (availableVoices.find((v) => v.identifier === config?.voiceId)?.name ??
        config?.voiceId ??
        '');

  const avatarLabel = config?.avatarConfig ? 'Custom' : 'Default';

  const personalityLabel = config?.systemPrompt
    ? config.systemPrompt.slice(0, 30) +
      (config.systemPrompt.length > 30 ? '...' : '')
    : 'Default';

  if (isLoading || !config) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ChatbotSettingsHeader
            isCreateMode={isCreateMode}
            isSaving={isSaving}
            onBack={back}
            onCreate={handleCreate}
          />

          <ScrollView contentContainerStyle={styles.content}>
            <ChatbotNameEditor
              avatarConfig={config.avatarConfig}
              modelId={config.llmModel}
              name={nameDraft}
              onNameChange={handleNameChange}
              providerId={config.llmProvider}
            />

            <ChatbotProfileSection
              avatarLabel={avatarLabel}
              onSelectAvatar={() => push('/settings-selection/avatar')}
              onSelectPersonality={() =>
                push('/settings-selection/personality')
              }
              onSelectVoice={() => push('/settings-selection/voice')}
              personalityLabel={personalityLabel}
              voiceLabel={voiceLabel}
            />

            <ChatbotIntelligenceSection
              apiKeyDraft={apiKeyDraft}
              hasProviderKey={hasProviderKey}
              modelLabel={modelLabel}
              modelsError={modelsError}
              modelsLoading={modelsLoading}
              onClearApiKey={clearProviderApiKey}
              onRefreshModels={refreshModels}
              onRevealApiKey={revealKey}
              onSaveApiKey={save}
              onSelectModel={() => push('/settings-selection/model')}
              onSelectProvider={() => push('/settings-selection/provider')}
              onUpdateApiKeyDraft={updateApiKeyDraft}
              providerLabel={providerLabel}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <ChatbotIdentitySection
              onClearMemory={clearMemory ?? undefined}
              uuid={config.uuid}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  error: {
    color: colors.error,
    fontSize: typography.sm,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
});
