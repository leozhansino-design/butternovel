import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-primary">ButterNovel</Text>
          <Text className="text-gray-500 text-lg">Read and share short stories</Text>
        </View>
        <Pressable className="flex-row items-center justify-center bg-white border py-4 rounded-xl mb-4">
          <Text className="text-xl mr-3">🔵</Text>
          <Text className="font-semibold">Continue with Google</Text>
        </Pressable>
        <Pressable className="flex-row items-center justify-center bg-black py-4 rounded-xl">
          <Text className="text-xl mr-3">🍎</Text>
          <Text className="text-white font-semibold">Continue with Apple</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-6 py-4">
          <Text className="text-gray-500 text-center">Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
