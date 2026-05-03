import { tv } from 'tailwind-variants';

import { View, Text } from '@/tw';
import type { ChatMessage } from '@/lib/llm/types';
import { TypingDots } from '@/components/typing-dots/TypingDots';

const messageRowCx = tv({
  base: 'mb-3 flex-row',
  variants: {
    isUser: {
      true: 'justify-end',
      false: 'justify-start',
    },
  },
});

const messageBubbleCx = tv({
  base: 'max-w-[85%] justify-center rounded-2xl px-4 py-3',
  variants: {
    isUser: {
      true: 'bg-accent',
      false: 'bg-bg-2',
    },
  },
});

const messageTextCx = tv({
  base: 'text-xl',
  variants: {
    isUser: {
      true: 'text-white',
      false: 'text-text',
    },
  },
});

interface ChatMessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatMessageBubble({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showTyping = isStreaming && !isUser && message.content.length === 0;

  return (
    <View testID="chat-message-row" className={messageRowCx({ isUser })}>
      <View
        testID="chat-message-bubble"
        className={messageBubbleCx({ isUser })}
      >
        {showTyping ? (
          <TypingDots />
        ) : (
          <Text
            testID="chat-message-text"
            className={messageTextCx({ isUser })}
          >
            {message.content}
            {isStreaming && !isUser && <Text className="text-text-2">▌</Text>}
          </Text>
        )}
      </View>
    </View>
  );
}
