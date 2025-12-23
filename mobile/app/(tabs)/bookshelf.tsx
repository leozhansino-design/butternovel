import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

export default function BookshelfScreen() {
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
          <Text className="text-white text-lg font-bold">My Bookshelf</Text>
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
          <Text className="text-gray-400 text-4xl mb-4">No books saved</Text>
          <Text className="text-gray-500 text-center mb-6 px-8">
            Save your favorite stories to read them anytime, even offline
          </Text>
          <Pressable className="bg-primary-500 px-6 py-3 rounded-full">
            <Text className="text-white font-semibold">Explore Stories</Text>
          </Pressable>
        </View>

        {/* Sections */}
        <View className="mt-12">
          <Text className="text-white text-lg font-semibold mb-4">
            Continue Reading
          </Text>
          <View className="bg-gray-900 rounded-xl p-4">
            <Text className="text-gray-500 text-center">
              Stories you&apos;re reading will appear here
            </Text>
          </View>
        </View>

        <View className="mt-8">
          <Text className="text-white text-lg font-semibold mb-4">
            Saved for Later
          </Text>
          <View className="bg-gray-900 rounded-xl p-4">
            <Text className="text-gray-500 text-center">
              Stories you save will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
