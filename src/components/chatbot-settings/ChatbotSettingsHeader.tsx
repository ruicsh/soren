import { ArrowLeft } from 'lucide-react-native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/theme';

export interface ChatbotSettingsHeaderProps {
  isCreateMode: boolean;
  isSaving: boolean;
  onBack: () => void;
  onCreate?: () => void;
}

export function ChatbotSettingsHeader(props: ChatbotSettingsHeaderProps) {
  const { isCreateMode, isSaving, onBack, onCreate } = props;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityLabel="Go back"
        onPress={onBack}
        testID="settings-back-button"
      >
        <ArrowLeft color={colors.text} size={24} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} testID="settings-header-title">
        {isCreateMode ? 'New Chatbot' : 'Settings'}
      </Text>
      {isCreateMode ? (
        <TouchableOpacity disabled={isSaving} onPress={onCreate}>
          {isSaving ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.headerBtnPrimary}>Create</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
