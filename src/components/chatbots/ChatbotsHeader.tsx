import { Plus } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface ChatbotsHeaderProps {
  onAdd: () => void;
  onDone: () => void;
}

export function ChatbotsHeader(props: ChatbotsHeaderProps) {
  const { onAdd, onDone } = props;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onDone}>
        <Text style={styles.headerBtn}>Done</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chatbots</Text>
      <TouchableOpacity accessibilityLabel="Add chatbot" onPress={onAdd}>
        <Plus color={colors.accent} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
  },
  headerBtn: {
    color: colors.accent,
    fontSize: typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '700',
  },
});
