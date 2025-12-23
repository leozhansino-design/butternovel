import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

export default function ProfileScreen() {
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
        <View className="flex-row items-center justify-between py-3 px-4">
          <Text className="text-white text-lg font-bold">Profile</Text>
          <Pressable>
            <Text className="text-primary-500">Settings</Text>
          </Pressable>
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
        {/* Profile Card */}
        <View className="items-center py-6">
          <View className="w-24 h-24 bg-gray-700 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-3xl">G</Text>
          </View>
          <Text className="text-white text-xl font-bold">Guest User</Text>
          <Text className="text-gray-500 mt-1">Not signed in</Text>
        </View>

        {/* Sign In Button */}
        <Pressable className="bg-primary-500 py-4 rounded-xl mt-4">
          <Text className="text-white text-center font-semibold text-lg">
            Sign In
          </Text>
        </Pressable>

        <Pressable className="border border-primary-500 py-4 rounded-xl mt-3">
          <Text className="text-primary-500 text-center font-semibold text-lg">
            Create Account
          </Text>
        </Pressable>

        {/* Stats */}
        <View className="flex-row justify-around py-6 mt-6 bg-gray-900 rounded-xl">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">0</Text>
            <Text className="text-gray-500 mt-1">Stories Read</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">0</Text>
            <Text className="text-gray-500 mt-1">Following</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">0</Text>
            <Text className="text-gray-500 mt-1">Bookmarked</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="mt-6">
          <MenuItem title="Reading History" />
          <MenuItem title="My Stories" />
          <MenuItem title="Notifications" />
          <MenuItem title="Theme" subtitle="Dark" />
          <MenuItem title="About ButterNovel" />
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Pressable className="flex-row items-center justify-between py-4 border-b border-gray-800">
      <Text className="text-white text-base">{title}</Text>
      <View className="flex-row items-center">
        {subtitle && <Text className="text-gray-500 mr-2">{subtitle}</Text>}
        <Text className="text-gray-500">›</Text>
      </View>
    </Pressable>
  );
}
