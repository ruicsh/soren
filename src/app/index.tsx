import { useRouter } from 'expo-router';
import { Brain as IconBrain, Phone } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatInput } from '@/components/chat-input/ChatInput';
import { ChatMessageBubble } from '@/components/chat-message/ChatMessage';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { colors, spacing, typography } from '@/theme';

export default function Home() {
  const { push } = useRouter();
  const { config } = useChatbotConfig();
  const { isStreaming, messages, sendMessage } = useChatStream();
  const scrollViewRef = useRef<ScrollView>(null);

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
        keyboardVerticalOffset={0}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => push('/settings')}>
            <Text style={styles.headerTitle}>{config?.name ?? 'Soren'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => push('/voice')}
            testID="voice-call-button"
          >
            <Phone color={colors.accent} pointerEvents="none" size={24} />
          </TouchableOpacity>
        </View>

        {/* Messages area */}
        {hasMessages ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            ref={scrollViewRef}
            style={styles.scroll}
          >
            {messages.map((msg) => (
              <ChatMessageBubble
                isStreaming={isStreaming && msg.id === lastMessageId}
                key={msg.id}
                message={msg}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <IconBrain color="#ffffff" size={40} />
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
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  emptyText: {
    color: colors.text2,
    fontSize: typography.xl,
    marginTop: spacing[2],
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '600',
  },
  inputWrap: {
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
});
