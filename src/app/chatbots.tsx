import { useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatbotAvatar } from '@/components/chatbot-avatar/ChatbotAvatar';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { colors, spacing, typography } from '@/theme';

export default function ChatbotsScreen() {
  const { back, push } = useRouter();
  const { chatbots, config, deleteChatbot, selectChatbot } = useChatbotConfig();

  const handleSelect = (uuid: string) => {
    selectChatbot(uuid);
    back();
  };

  const renderRightActions = (uuid: string) => {
    return (
      <TouchableOpacity
        onPress={() => deleteChatbot(uuid)}
        style={styles.deleteAction}
      >
        <Trash2 color="#ffffff" size={24} />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: (typeof chatbots)[0] }) => {
    const isActive = config?.uuid === item.uuid;
    const time = item.lastConversationAt
      ? new Date(item.lastConversationAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.uuid)}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelect(item.uuid)}
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
            <Text numberOfLines={1} style={styles.itemSnippet}>
              {item.lastConversationSnippet || 'No messages yet'}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => back()}>
          <Text style={styles.headerBtn}>Done</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chatbots</Text>
        <TouchableOpacity
          accessibilityLabel="Add chatbot"
          onPress={() => push('/chatbot-settings?mode=create')}
        >
          <Plus color={colors.accent} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chatbots}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.uuid}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginRight: spacing[3],
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  deleteAction: {
    alignItems: 'center',
    backgroundColor: colors.error,
    justifyContent: 'center',
    width: 80,
  },
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
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: 70, // Avatar width + margins
  },
});
