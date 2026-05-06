import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatbotConfigProvider } from '@/context/ChatbotConfigContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ChatbotConfigProvider>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
      </ChatbotConfigProvider>
    </SafeAreaProvider>
  );
}
