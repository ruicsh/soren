import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app/AppHeader';
import { colors, typography } from '@/theme';

export interface ChatbotSettingsHeaderProps {
  isCreateMode: boolean;
  isSaving: boolean;
  onBack: () => void;
  onCreate?: () => void;
}

export function ChatbotSettingsHeader(props: ChatbotSettingsHeaderProps) {
  const { isCreateMode, isSaving, onBack, onCreate } = props;

  return (
    <View testID="settings-header-wrapper">
      <AppHeader
        centerTestID="settings-header-title"
        onBack={onBack}
        rightSlot={
          isCreateMode ? (
            <TouchableOpacity disabled={isSaving} onPress={onCreate}>
              {isSaving ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={styles.headerBtnPrimary}>Create</Text>
              )}
            </TouchableOpacity>
          ) : undefined
        }
        title={isCreateMode ? 'New Chatbot' : 'Settings'}
        variant="title"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtnPrimary: {
    color: colors.accent,
    fontSize: typography.base,
    fontWeight: '600',
  },
});
