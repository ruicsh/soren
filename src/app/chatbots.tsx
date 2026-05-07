import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatbotListItem } from '@/components/chatbots/ChatbotListItem';
import { ChatbotsHeader } from '@/components/chatbots/ChatbotsHeader';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { colors } from '@/theme';

export default function ChatbotsScreen() {
  const { back, push } = useRouter();
  const { chatbots, config, deleteChatbot, selectChatbot } = useChatbotConfig();

  const handleSelect = (uuid: string) => {
    selectChatbot(uuid);
    back();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <ChatbotsHeader
        onAdd={() => push('/chatbot-settings?mode=create')}
        onDone={() => back()}
      />

      <FlatList
        data={chatbots}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: 70, // Avatar width + margins
  },
});
