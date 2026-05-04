import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Brain as IconBrain } from 'lucide-react-native';
import { useRef, useEffect } from 'react';

import { ChatInput } from '@/components/chat-input/ChatInput';
import { ChatMessageBubble } from '@/components/chat-message/ChatMessage';
import { useChatStream } from '@/hooks/use-chat-stream';
import { colors, spacing, typography } from '@/theme';

export default function Home() {
  const { messages, isStreaming, sendMessage } = useChatStream();
  const scrollViewRef = useRef<any>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && 'scrollToEnd' in scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isStreaming]);

  const hasMessages = messages.length > 0;
  const lastMessageId = messages[messages.length - 1]?.id;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {/* Messages area */}
        {hasMessages ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg.id === lastMessageId}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <IconBrain color="white" size={40} />
            <Text style={styles.emptyText}>How can I help you today?</Text>
          </View>
        )}

        {/* Input bar at bottom */}
        <View style={styles.inputWrap}>
          <ChatInput onSend={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  emptyText: {
    color: colors.text2,
    marginTop: spacing[2],
    fontSize: typography.xl,
  },
  inputWrap: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
});
