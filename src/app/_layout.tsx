import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatbotConfigProvider } from '@/context/ChatbotConfigContext';
import { ExecutorchProvider } from '@/context/ExecutorchContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExecutorchProvider>
          <ChatbotConfigProvider>
            <Stack
              screenOptions={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            >
              <Stack.Screen
                name="chatbots"
                options={{ animation: 'slide_from_left' }}
              />
            </Stack>
          </ChatbotConfigProvider>
        </ExecutorchProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
