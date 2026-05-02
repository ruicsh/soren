import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/styles/global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
