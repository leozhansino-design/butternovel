import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-2xl">←</Text>
        </Pressable>
        <Text className="text-lg font-semibold flex-1 text-center">Story {id}</Text>
        <View className="w-10" />
      </View>
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-2xl font-bold mb-2">The Last Summer</Text>
        <Text className="text-gray-500 mb-6">by Emily Chen</Text>
        <Text className="text-lg leading-8 text-gray-800">
          The sun was setting over the old pier, casting long shadows across the weathered wooden planks...
          {"\n\n"}
          She remembered the way the light had danced on the water, the sound of laughter echoing across the bay...
          {"\n\n"}
          [Full story content here - tap paragraphs to comment]
        </Text>
        <Pressable className="bg-primary py-4 rounded-xl mt-8 items-center">
          <Text className="text-white font-semibold">Rate this Story ⭐</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
