import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookshelfScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold">Bookshelf</Text>
        <Text className="text-gray-500 mt-1">Your saved stories</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text className="text-6xl mb-4">📚</Text>
        <Text className="text-xl font-semibold">No stories yet</Text>
      </View>
    </SafeAreaView>
  );
}
