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
      <View style={styles.sideSlot}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={onBack}
          testID="settings-back-button"
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.centerSlot}>
        <Text style={styles.headerTitle} testID="settings-header-title">
          {isCreateMode ? 'New Chatbot' : 'Settings'}
        </Text>
      </View>

      <View style={[styles.sideSlot, styles.rightSlot]}>
        {isCreateMode && (
          <TouchableOpacity disabled={isSaving} onPress={onCreate}>
            {isSaving ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Text style={styles.headerBtnPrimary}>Create</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
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
    textAlign: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  sideSlot: {
    justifyContent: 'center',
    minWidth: 60,
  },
});
