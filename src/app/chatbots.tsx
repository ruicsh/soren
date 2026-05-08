import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app/AppHeader';
import { ChatbotListItem } from '@/components/chatbots/ChatbotListItem';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { getDateLabel } from '@/lib/date-label';
import { colors, spacing, typography } from '@/theme';

export default function ChatbotsScreen() {
  const { back, push } = useRouter();
  const { chatbots, config, deleteChatbot, selectChatbot } = useChatbotConfig();

  const handleSelect = (uuid: string) => {
    selectChatbot(uuid);
    back();
  };

  // Group chatbots by date labels
  const groupedChatbots = chatbots.reduce(
    (groups, chatbot) => {
      const label = getDateLabel(chatbot.lastConversationAt);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(chatbot);

      return groups;
    },
    {} as Record<string, typeof chatbots>,
  );

  // Sort groups: today, yesterday, weekdays (Mon-Sun), then fallback
  const groupOrder = ['today', 'yesterday'];
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  groupOrder.push(...weekdays);

  const sections = Object.keys(groupedChatbots)
    .sort((a, b) => {
      const aIndex = groupOrder.indexOf(a);
      const bIndex = groupOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Both are fallback dates, sort alphabetically (newer dates first? but since it's date string, alphabetical might work)
      return a.localeCompare(b);
    })
    .map((title) => ({
      data: groupedChatbots[title],
      title,
    }));

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <AppHeader
        hideBackButton
        rightSlot={
          <TouchableOpacity
            accessibilityLabel="Add chatbot"
            onPress={() => push('/chatbot-settings?mode=create')}
          >
            <Plus color={colors.accent} size={24} />
          </TouchableOpacity>
        }
        title="Chatbots"
        variant="title"
      />

      <SectionList
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => (
          <ChatbotListItem
            isActive={config?.uuid === item.uuid}
            item={item}
            onDelete={deleteChatbot}
            onSelect={handleSelect}
          />
        )}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: colors.bg,
    paddingBottom: spacing[1],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  sectionHeaderText: {
    color: colors.text2,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: 70, // Avatar width + margins
  },
});
