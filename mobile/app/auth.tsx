import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google OAuth with expo-auth-session
    console.log("Google sign in");
  };

  const handleAppleSignIn = async () => {
    // TODO: Implement Apple Sign In with expo-auth-session
    console.log("Apple sign in");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        {/* Header */}
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-primary mb-2">ButterNovel</Text>
          <Text className="text-gray-500 text-lg text-center">
            Read and share short stories
          </Text>
        </View>

        {/* Sign in buttons */}
        <View className="gap-4">
          {/* Google Sign In */}
          <Pressable
            onPress={handleGoogleSignIn}
            className="flex-row items-center justify-center bg-white border border-gray-300 py-4 px-6 rounded-xl"
          >
            <Text className="text-2xl mr-3">🔵</Text>
            <Text className="text-gray-700 font-semibold text-lg">
              Continue with Google
            </Text>
          </Pressable>

          {/* Apple Sign In */}
          <Pressable
            onPress={handleAppleSignIn}
            className="flex-row items-center justify-center bg-black py-4 px-6 rounded-xl"
          >
            <Text className="text-2xl mr-3">🍎</Text>
            <Text className="text-white font-semibold text-lg">
              Continue with Apple
            </Text>
          </Pressable>
        </View>

        {/* Terms */}
        <View className="mt-8">
          <Text className="text-gray-500 text-center text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Skip button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-6 py-4"
        >
          <Text className="text-gray-500 text-center font-medium">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
