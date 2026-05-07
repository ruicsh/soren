import { StyleSheet, Text, View } from 'react-native';

import { SettingSelectRow } from '@/components/settings/SettingSelectRow';
import { colors, radius, spacing, typography } from '@/theme';

export interface ChatbotProfileSectionProps {
  onSelectVoice: () => void;
  voiceLabel: string;
}

export function ChatbotProfileSection(props: ChatbotProfileSectionProps) {
  const { onSelectVoice, voiceLabel } = props;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chatbot Profile</Text>
      <View style={styles.card}>
        <SettingSelectRow
          label="Voice"
          onPress={onSelectVoice}
          value={voiceLabel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    overflow: 'hidden',
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
});
