import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

export default function FollowingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <BlurView
        intensity={80}
        tint="dark"
        className="absolute top-0 left-0 right-0 z-10"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-center py-3">
          <Text className="text-white text-lg font-bold">Following</Text>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: 100,
          paddingHorizontal: 16,
        }}
      >
        {/* Empty State */}
        <View className="items-center justify-center mt-20">
          <Text className="text-gray-400 text-4xl mb-4">No authors yet</Text>
          <Text className="text-gray-500 text-center mb-6 px-8">
            Follow your favorite authors to see their latest stories here
          </Text>
          <Pressable className="bg-primary-500 px-6 py-3 rounded-full">
            <Text className="text-white font-semibold">Discover Authors</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
