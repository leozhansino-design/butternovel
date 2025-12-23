import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold">Profile</Text>
      </View>
      <View className="mx-6 p-6 bg-white rounded-2xl">
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-3">
            <Text className="text-primary text-3xl">G</Text>
          </View>
          <Text className="text-xl font-semibold">Guest User</Text>
        </View>
        <Pressable onPress={() => router.push("/auth")} className="bg-primary py-4 rounded-xl items-center">
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
