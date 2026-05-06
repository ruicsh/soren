import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Key, Trash2 } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatbotAvatar } from '@/components/chatbot-avatar/ChatbotAvatar';
import { SettingSelectRow } from '@/components/settings/SettingSelectRow';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useDebounce } from '@/hooks/use-debounce';
import { colors, radius, spacing, typography } from '@/theme';

export default function ChatbotSettingsScreen() {
  const { back, push, replace } = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isCreateMode = mode === 'create';

  const [nameDraft, setNameDraft] = React.useState('');

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

  const debouncedSaveName = useDebounce((name: string) => {
    saveWithConfig({ name });
  }, 1000);

  const [showKey, setShowKey] = React.useState(false);

  const hasCreated = React.useRef(false);

  const handleCreate = async () => {
    // Only used for initial creation in Create Mode
    await saveWithConfig({ name: nameDraft });
    replace('/');
  };

  const handleNameChange = (text: string) => {
    setNameDraft(text);
    debouncedSaveName(text);
  };

  React.useEffect(() => {
    if (isCreateMode && !isLoading && !hasCreated.current) {
      hasCreated.current = true;
      createChatbot();
    }
  }, [isCreateMode, isLoading, createChatbot]);

  // Only sync name from config when bot UUID changes
  const lastUuid = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (config?.uuid !== lastUuid.current) {
      lastUuid.current = config?.uuid;
      setNameDraft(config?.name ?? '');
    }
  }, [config?.uuid, config?.name]);

  const providerEntry = availableProviders.find(
    (p) => p.id === config?.llmProvider,
  );
  const providerLabel = providerEntry?.label ?? config?.llmProvider;

  const modelLabel =
    availableModels.find((m) => m.id === config?.llmModel)?.name ??
    config?.llmModel;

  const voiceLabel =
    config?.voiceId === null
      ? 'Auto (Default)'
      : (availableVoices.find((v) => v.identifier === config?.voiceId)?.name ??
        config?.voiceId);

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
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityLabel="Go back"
              onPress={() => back()}
            >
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isCreateMode ? 'New Chatbot' : 'Settings'}
            </Text>
            {isCreateMode ? (
              <TouchableOpacity disabled={isSaving} onPress={handleCreate}>
                {isSaving ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Text style={styles.headerBtnPrimary}>Create</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={{ width: 48 }} /> // Balanced header
            )}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <ChatbotAvatar
                    modelId={config.llmModel}
                    providerId={config.llmProvider}
                    size={48}
                  />
                </View>
                <TextInput
                  onChangeText={handleNameChange}
                  placeholder="Enter name"
                  placeholderTextColor={colors.text3}
                  style={styles.avatarNameInput}
                  value={nameDraft}
                />
              </View>

              <Text style={styles.sectionTitle}>Identification</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.label}>UUID</Text>
                  <Text selectable style={styles.value}>
                    {config.uuid}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Intelligence</Text>
              <View style={styles.card}>
                <SettingSelectRow
                  label="Provider"
                  onPress={() => push('/settings-selection/provider')}
                  value={providerLabel ?? null}
                />
                <View style={styles.separator} />
                <View style={[styles.row, styles.rowInput]}>
                  <View style={styles.rowInline}>
                    <Key
                      color={hasProviderKey ? colors.accent : colors.text3}
                      size={16}
                      style={{ marginRight: spacing[2] }}
                    />
                    <Text style={styles.label}>API Key</Text>
                  </View>
                  <View
                    style={[
                      styles.rowInline,
                      { flex: 1, justifyContent: 'flex-end' },
                    ]}
                  >
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={() => apiKeyDraft && save()}
                      onChangeText={updateApiKeyDraft}
                      placeholder={
                        hasProviderKey
                          ? '••••••••••••'
                          : `Enter ${providerLabel} key`
                      }
                      placeholderTextColor={colors.text3}
                      secureTextEntry={!showKey}
                      style={[styles.input, { textAlign: 'right' }]}
                      value={apiKeyDraft}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        if (!showKey && !apiKeyDraft && hasProviderKey) {
                          await revealKey();
                        }

                        setShowKey(!showKey);
                      }}
                      style={{ paddingHorizontal: spacing[2] }}
                      testID="eye-icon-button"
                    >
                      {showKey ? (
                        <EyeOff color={colors.text3} size={20} />
                      ) : (
                        <Eye color={colors.text3} size={20} />
                      )}
                    </TouchableOpacity>
                    {hasProviderKey && (
                      <TouchableOpacity
                        onPress={clearProviderApiKey}
                        style={{ paddingLeft: spacing[1] }}
                      >
                        <Trash2 color={colors.error} size={20} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.separator} />
                <SettingSelectRow
                  disabled={modelsLoading || (!hasProviderKey && !apiKeyDraft)}
                  label="Model"
                  onPress={() => push('/settings-selection/model')}
                  value={modelLabel ?? null}
                />
              </View>
              {modelsError && (
                <TouchableOpacity
                  onPress={refreshModels}
                  style={styles.errorRetry}
                >
                  <Text style={styles.errorTextSmall}>
                    {modelsError}. Tap to retry.
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chatbot Profile</Text>
              <View style={styles.card}>
                <SettingSelectRow
                  label="Voice"
                  onPress={() => push('/settings-selection/voice')}
                  value={voiceLabel ?? null}
                />
              </View>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.full,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing[2],
    width: 64,
  },
  avatarName: {
    color: colors.text,
    fontSize: typography.xl,
    fontWeight: '700',
  },
  avatarNameInput: {
    color: colors.text,
    fontSize: typography.xl,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[2],
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  column: {
    padding: spacing[4],
  },
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
  errorRetry: {
    paddingVertical: spacing[2],
  },
  errorTextSmall: {
    color: colors.error,
    fontSize: typography.xs,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerBtnPrimary: {
    color: colors.accent,
    fontSize: typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '600',
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.base,
    textAlign: 'right',
  },
  label: {
    color: colors.text,
    fontSize: typography.base,
  },
  loader: {
    marginLeft: spacing[2],
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  picker: {
    color: colors.text,
    marginHorizontal: -spacing[2],
  },
  pickerWrap: {
    marginTop: -spacing[2],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  rowInline: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowInput: {
    paddingVertical: spacing[2],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    color: colors.text3,
    fontSize: typography.xs,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[4],
  },
  value: {
    color: colors.text,
    fontSize: typography.sm,
  },
});
