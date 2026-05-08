import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface ChatbotIdentitySectionProps {
  onClearMemory?: () => void;
  uuid: string;
}

export function ChatbotIdentitySection(props: ChatbotIdentitySectionProps) {
  const { onClearMemory, uuid } = props;

  const handleClearMemory = () => {
    Alert.alert(
      'Clear Memory',
      'This will permanently delete all stored interactions for this chatbot. This cannot be undone.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: onClearMemory,
          style: 'destructive',
          text: 'Clear',
        },
      ],
    );
  };

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

        {onClearMemory && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearMemory}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear Memory</Text>
          </TouchableOpacity>
        )}
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
  clearButton: {
    alignItems: 'center',
    backgroundColor: colors.bg3,
    justifyContent: 'center',
    padding: spacing[3],
  },
  clearButtonText: {
    color: colors.error,
    fontSize: typography.sm,
    fontWeight: '600',
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
