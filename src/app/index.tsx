import { SafeAreaView, Text, View } from '@/tw';

export default function Home() {
  return (
    <SafeAreaView className="bg-bg flex-1">
      <View className="flex-1 gap-6 p-6">
        {/* Heading */}
        <View className="gap-1">
          <Text className="text-text text-3xl font-bold">Hello, World!</Text>
          <Text className="text-text-2 text-base">
            SF semantic colors · system dark/light mode
          </Text>
        </View>

        <View className="gap-3">
          {/* Accent */}
          <View className="flex-row items-center gap-3">
            <View className="bg-accent h-8 w-8 rounded-lg" />
            <Text className="text-text text-base">Accent</Text>
          </View>
          {/* Success */}
          <View className="flex-row items-center gap-3">
            <View className="bg-success h-8 w-8 rounded-lg" />
            <Text className="text-text text-base">Success</Text>
          </View>
          {/* Error */}
          <View className="flex-row items-center gap-3">
            <View className="bg-error h-8 w-8 rounded-lg" />
            <Text className="text-text text-base">Error</Text>
          </View>
          {/* Warning */}
          <View className="flex-row items-center gap-3">
            <View className="bg-warning h-8 w-8 rounded-lg" />
            <Text className="text-text text-base">Warning</Text>
          </View>
        </View>

        {/* Separator */}
        <View className="bg-separator h-px" />

        {/* Background levels */}
        <View className="gap-3">
          <Text className="text-text-2 text-sm font-semibold">Surfaces</Text>
          <View className="border-border bg-bg-2 rounded-xl border p-4">
            <Text className="text-text text-base">Secondary surface</Text>
          </View>
          <View className="border-border bg-bg-3 rounded-xl border p-4">
            <Text className="text-text text-base">Tertiary surface</Text>
          </View>
        </View>

        {/* Fill example */}
        <View className="bg-fill rounded-xl p-4">
          <Text className="text-text text-base">Fill background</Text>
        </View>

        <View className="bg-fill-2 rounded-xl p-4">
          <Text className="text-text text-base">Secondary fill</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
