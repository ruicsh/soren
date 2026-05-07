import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface ChatbotIdentitySectionProps {
  uuid: string;
}

export function ChatbotIdentitySection(props: ChatbotIdentitySectionProps) {
  const { uuid } = props;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Identification</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>UUID</Text>
          <Text selectable style={styles.value}>
            {uuid}
          </Text>
        </View>
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
  label: {
    color: colors.text,
    fontSize: typography.base,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
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
  value: {
    color: colors.text3,
    fontSize: typography.sm,
  },
});
