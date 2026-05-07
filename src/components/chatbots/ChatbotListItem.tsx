import { Trash2 } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { ChatbotConfig } from '@/lib/chatbot-config';

import { ChatbotAvatar } from '@/components/chatbot-avatar/ChatbotAvatar';
import { colors, spacing, typography } from '@/theme';

interface ChatbotListItemProps {
  isActive: boolean;
  item: ChatbotConfig;
  onDelete: (uuid: string) => void;
  onSelect: (uuid: string) => void;
}

export function ChatbotListItem(props: ChatbotListItemProps) {
  const { isActive, item, onDelete, onSelect } = props;

  const time = item.lastConversationAt
    ? new Date(item.lastConversationAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        accessibilityLabel="Delete chatbot"
        onPress={() => onDelete(item.uuid)}
        style={styles.deleteAction}
      >
        <Trash2 color="#ffffff" size={24} />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(item.uuid)}
        style={[styles.item, isActive && styles.itemActive]}
      >
        <View style={styles.avatarContainer}>
          <ChatbotAvatar
            modelId={item.llmModel}
            providerId={item.llmProvider}
            size={50}
          />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>
            <Text style={styles.itemTime}>{time}</Text>
          </View>
          <Text style={styles.itemModel}>
            {item.llmProvider}:{item.llmModel}
          </Text>
          <Text numberOfLines={1} style={styles.itemSnippet}>
            {item.lastConversationSnippet || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginRight: spacing[3],
  },
  deleteAction: {
    alignItems: 'center',
    backgroundColor: colors.error,
    justifyContent: 'center',
    width: 80,
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  itemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemContent: {
    borderBottomColor: colors.border,
    flex: 1,
    justifyContent: 'center',
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  itemModel: {
    color: colors.text2,
    fontSize: 10,
    marginBottom: 2,
  },
  itemName: {
    color: colors.text,
    fontSize: typography.base,
    fontWeight: '600',
  },
  itemSnippet: {
    color: colors.text2,
    fontSize: typography.sm,
  },
  itemTime: {
    color: colors.text3,
    fontSize: typography.xs,
  },
});
