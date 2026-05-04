import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/lib/llm/types';
import { TypingDots } from '@/components/typing-dots/TypingDots';
import { colors, spacing, radius, typography } from '@/theme';

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatMessageBubble({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showTyping = isStreaming && !isUser && message.content.length === 0;

  return (
    <View
      testID="chat-message-row"
      style={isUser ? styles.rowUser : styles.rowAssistant}
    >
      <View
        testID="chat-message-bubble"
        style={isUser ? styles.bubbleUser : styles.bubbleAssistant}
      >
        {showTyping ? (
          <TypingDots />
        ) : (
          <Text
            testID="chat-message-text"
            style={isUser ? styles.textUser : styles.textAssistant}
          >
            {message.content}
            {isStreaming && !isUser && <Text style={styles.cursor}>▌</Text>}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowUser: {
    marginBottom: spacing[3],
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    marginBottom: spacing[3],
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bubbleUser: {
    maxWidth: '85%',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.accent,
  },
  bubbleAssistant: {
    maxWidth: '85%',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg2,
  },
  textUser: {
    fontSize: typography.xl,
    color: 'white',
  },
  textAssistant: {
    fontSize: typography.xl,
    color: colors.text,
  },
  cursor: {
    color: colors.text2,
  },
});
