import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View } from '@/tw';

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center bg-orange-500">
        <Text className="mt-4 rounded-md border-4 border-black bg-cyan-500 p-3 text-center text-3xl font-bold text-black">
          hello, world!
        </Text>
      </View>
    </SafeAreaView>
  );
}
