import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SettingSelectRow } from '@/components/settings/SettingSelectRow';
import { colors, radius, spacing, typography } from '@/theme';

import { ApiKeyRow } from './ApiKeyRow';

interface ChatbotIntelligenceSectionProps {
  apiKeyDraft: string;
  hasProviderKey: boolean;
  modelLabel: string;
  modelsError: null | string;
  modelsLoading: boolean;
  onClearApiKey: () => void;
  onRefreshModels: () => void;
  onRevealApiKey: () => Promise<void>;
  onSaveApiKey: () => void;
  onSelectModel: () => void;
  onSelectProvider: () => void;
  onUpdateApiKeyDraft: (text: string) => void;
  providerLabel: string;
}

export function ChatbotIntelligenceSection(
  props: ChatbotIntelligenceSectionProps,
) {
  const {
    apiKeyDraft,
    hasProviderKey,
    modelLabel,
    modelsError,
    modelsLoading,
    onClearApiKey,
    onRefreshModels,
    onRevealApiKey,
    onSaveApiKey,
    onSelectModel,
    onSelectProvider,
    onUpdateApiKeyDraft,
    providerLabel,
  } = props;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Intelligence</Text>
      <View style={styles.card}>
        <SettingSelectRow
          label="Provider"
          onPress={onSelectProvider}
          value={providerLabel}
        />
        <View style={styles.separator} />
        <ApiKeyRow
          apiKeyDraft={apiKeyDraft}
          hasProviderKey={hasProviderKey}
          onClear={onClearApiKey}
          onReveal={onRevealApiKey}
          onSave={onSaveApiKey}
          onUpdateDraft={onUpdateApiKeyDraft}
          providerLabel={providerLabel}
        />
        <View style={styles.separator} />
        <SettingSelectRow
          disabled={modelsLoading || (!hasProviderKey && !apiKeyDraft)}
          label="Model"
          onPress={onSelectModel}
          value={modelLabel}
        />
      </View>
      {modelsError && (
        <TouchableOpacity onPress={onRefreshModels} style={styles.errorRetry}>
          <Text style={styles.errorTextSmall}>
            {modelsError}. Tap to retry.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  errorRetry: {
    paddingVertical: spacing[2],
  },
  errorTextSmall: {
    color: colors.error,
    fontSize: typography.xs,
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
});
