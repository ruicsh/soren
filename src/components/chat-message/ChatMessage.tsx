import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/lib/llm/types';

import { TypingDots } from '@/components/typing-dots/TypingDots';
import { colors, radius, spacing, typography } from '@/theme';

export interface ChatMessageProps {
  isStreaming?: boolean;
  message: ChatMessage;
}

export const ChatMessageBubble = memo(function ChatMessageBubble(
  props: ChatMessageProps,
) {
  const { isStreaming = false, message } = props;

  const isUser = message.role === 'user';
  const showTyping = isStreaming && !isUser && message.content.length === 0;

  return (
    <View
      style={isUser ? styles.rowUser : styles.rowAssistant}
      testID="chat-message-row"
    >
      <View
        style={isUser ? styles.bubbleUser : styles.bubbleAssistant}
        testID="chat-message-bubble"
      >
        {showTyping ? (
          <TypingDots />
        ) : (
          <Text
            style={isUser ? styles.textUser : styles.textAssistant}
            testID="chat-message-text"
          >
            {message.content}
            {isStreaming && !isUser && <Text style={styles.cursor}>▌</Text>}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bubbleAssistant: {
    backgroundColor: colors.bg2,
    borderRadius: radius['2xl'],
    justifyContent: 'center',
    maxWidth: '85%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  bubbleUser: {
    backgroundColor: colors.accent,
    borderRadius: radius['2xl'],
    justifyContent: 'center',
    maxWidth: '85%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  cursor: {
    color: colors.text2,
  },
  rowAssistant: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing[3],
  },
  rowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing[3],
  },
  textAssistant: {
    color: colors.text,
    fontSize: typography.base,
  },
  textUser: {
    color: '#ffffff',
    fontSize: typography.base,
  },
});
