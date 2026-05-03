import { Platform } from 'react-native';
import { Brain as IconBrain } from 'lucide-react-native';

import { KeyboardAvoidingView, SafeAreaView, Text, View } from '@/tw';
import { ChatInput } from '@/components/chat-input/ChatInput';

export default function Home() {
  const handleSend = (text: string) => {
    console.log('Send:', text);
  };

  return (
    <SafeAreaView className="bg-bg flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Main content area */}
        <View className="flex-1 items-center justify-center px-6">
          <IconBrain color="white" size={40} />
          <Text className="text-text-2 mt-2 text-base">
            How can I help you today?
          </Text>
        </View>

        {/* Input bar at bottom */}
        <View className="px-4 pb-4">
          <ChatInput onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
