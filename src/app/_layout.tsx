import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatbotConfigProvider } from '@/context/ChatbotConfigContext';
import { ExecutorchProvider } from '@/context/ExecutorchContext';
import { VectorStoreProvider } from '@/context/VectorStoreContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ExecutorchProvider>
          <VectorStoreProvider>
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
          </VectorStoreProvider>
        </ExecutorchProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
