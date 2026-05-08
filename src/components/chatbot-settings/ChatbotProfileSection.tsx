import { StyleSheet, Text, View } from 'react-native';

import { SettingSelectRow } from '@/components/settings/SettingSelectRow';
import { colors, radius, spacing, typography } from '@/theme';

export interface ChatbotProfileSectionProps {
  avatarLabel: string;
  onSelectAvatar: () => void;
  onSelectPersonality: () => void;
  onSelectVoice: () => void;
  personalityLabel: string;
  voiceLabel: string;
}

export function ChatbotProfileSection(props: ChatbotProfileSectionProps) {
  const {
    avatarLabel,
    onSelectAvatar,
    onSelectPersonality,
    onSelectVoice,
    personalityLabel,
    voiceLabel,
  } = props;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Chatbot Profile</Text>
      <View style={styles.card}>
        <SettingSelectRow
          label="Avatar"
          onPress={onSelectAvatar}
          value={avatarLabel}
        />
        <View style={styles.separator} />
        <SettingSelectRow
          label="Personality"
          onPress={onSelectPersonality}
          value={personalityLabel}
        />
        <View style={styles.separator} />
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
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[4],
  },
});
