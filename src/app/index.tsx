import { useRouter } from 'expo-router';
import { ChevronLeft, Brain as IconBrain, Phone } from 'lucide-react-native';
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
import { ChatbotAvatar } from '@/components/chatbot-avatar/ChatbotAvatar';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { colors, radius, spacing, typography } from '@/theme';

export default function Home() {
  const { push } = useRouter();
  const { config, updateLastConversation } = useChatbotConfig();
  const { isStreaming, messages, sendMessage } = useChatStream({
    chatbotUuid: config?.uuid,
    lastConversationAt: config?.lastConversationAt,
    onStreamingChunk: (chunk) => {
      // Logic for capturing snippet usually happens on first chunk or completion
      // But updateLastConversation handles splitting and updating
    },
    providerId: config?.llmProvider,
    providerModel: config?.llmModel,
  });

  const lastUserTextRef = useRef<null | string>(null);

  const lastUpdateRef = useRef(false);
  useEffect(() => {
    if (!isStreaming && lastUpdateRef.current) {
      const assistantMsgs = messages.filter((m) => m.role === 'assistant');
      const lastAssistantMsg = assistantMsgs[assistantMsgs.length - 1];
      if (lastAssistantMsg?.content && lastUserTextRef.current) {
        updateLastConversation(
          lastUserTextRef.current,
          lastAssistantMsg.content,
        );
        lastUserTextRef.current = null;
      }
      lastUpdateRef.current = false;
    } else if (isStreaming) {
      lastUpdateRef.current = true;
    }
  }, [isStreaming, messages, updateLastConversation]);

  const handleSendMessage = async (text: string) => {
    lastUserTextRef.current = text;
    await sendMessage(text);
  };
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
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => push('/chatbots')}
              style={styles.backButton}
            >
              <ChevronLeft color={colors.accent} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => push('/chatbot-settings')}
              style={styles.headerProfile}
            >
              <View style={styles.avatarContainer}>
                <ChatbotAvatar
                  modelId={config?.llmModel}
                  providerId={config?.llmProvider}
                  size={32}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {config?.name ?? 'Soren'}
                </Text>
                {config?.lastConversationAt && (
                  <Text style={styles.headerSubtitle}>
                    Last active:{' '}
                    {new Date(config.lastConversationAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
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
            <TouchableOpacity
              onPress={() => push('/chatbot-settings')}
              style={styles.emptyIcon}
            >
              <IconBrain color="#ffffff" size={40} />
            </TouchableOpacity>
            <Text style={styles.emptyText}>
              {config?.lastConversationSnippet || 'How can I help you today?'}
            </Text>
          </View>
        )}

        {/* Input bar at bottom */}
        <View style={styles.inputWrap}>
          <ChatInput onSend={handleSendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing[2],
    width: 40,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    marginRight: spacing[4],
    width: 36,
  },
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
  emptyIcon: {
    marginBottom: spacing[2],
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
    paddingHorizontal: spacing[2],
    paddingTop: spacing[4],
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  headerProfile: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  headerSubtitle: {
    color: colors.text2,
    fontSize: 10,
    marginTop: 2,
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
