import { Platform } from 'react-native';
import { Brain as IconBrain } from 'lucide-react-native';
import { useRef, useEffect } from 'react';

import {
  KeyboardAvoidingView,
  SafeAreaView,
  Text,
  View,
  ScrollView,
} from '@/tw';
import { ChatInput } from '@/components/chat-input/ChatInput';
import { ChatMessageBubble } from '@/components/chat-message/ChatMessage';
import { useChatStream } from '@/hooks/use-chat-stream';

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
    <SafeAreaView className="bg-bg flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages area */}
        {hasMessages ? (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-4"
            contentContainerClassName="pb-4"
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
          <View className="flex-1 items-center justify-center px-6">
            <IconBrain color="white" size={40} />
            <Text className="text-text-2 mt-2 text-xl">
              How can I help you today?
            </Text>
          </View>
        )}

        {/* Input bar at bottom */}
        <View className="px-4 pb-4">
          <ChatInput onSend={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
