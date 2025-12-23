import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Mock user data - will be replaced with auth store
const mockUser = {
  name: "Guest User",
  email: null,
  isLoggedIn: false,
  stats: {
    storiesRead: 0,
    storiesWritten: 0,
    followers: 0,
    following: 0,
  },
};

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
    >
      <View className="flex-row items-center">
        <Text className="text-xl mr-3">{icon}</Text>
        <Text className="text-gray-700 text-lg">{label}</Text>
      </View>
      <Text className="text-gray-400 text-xl">›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-gray-900">Profile</Text>
        </View>

        {/* Profile card */}
        <View className="mx-6 p-6 bg-white rounded-2xl border border-gray-100">
          {/* Avatar and name */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-3">
              <Text className="text-primary text-3xl font-bold">
                {mockUser.name[0]}
              </Text>
            </View>
            <Text className="text-xl font-semibold text-gray-900">{mockUser.name}</Text>
            {mockUser.email && (
              <Text className="text-gray-500">{mockUser.email}</Text>
            )}
          </View>

          {/* Stats */}
          <View className="flex-row py-4 border-t border-b border-gray-100">
            <StatBox label="Read" value={mockUser.stats.storiesRead} />
            <StatBox label="Written" value={mockUser.stats.storiesWritten} />
            <StatBox label="Followers" value={mockUser.stats.followers} />
            <StatBox label="Following" value={mockUser.stats.following} />
          </View>

          {/* Login button (if not logged in) */}
          {!mockUser.isLoggedIn && (
            <View className="mt-4">
              <Pressable
                onPress={() => router.push("/auth")}
                className="bg-primary py-4 rounded-xl items-center mb-3"
              >
                <Text className="text-white font-semibold text-lg">Sign In</Text>
              </Pressable>
              <Text className="text-gray-500 text-center text-sm">
                Sign in to sync your reading progress and publish stories
              </Text>
            </View>
          )}
        </View>

        {/* Menu items */}
        <View className="mx-6 mt-6 bg-white rounded-2xl border border-gray-100 px-4">
          <MenuItem icon="📖" label="My Stories" onPress={() => {}} />
          <MenuItem icon="❤️" label="Liked Stories" onPress={() => {}} />
          <MenuItem icon="📝" label="My Comments" onPress={() => {}} />
          <MenuItem icon="🔔" label="Notifications" onPress={() => {}} />
          <MenuItem icon="⚙️" label="Settings" onPress={() => {}} />
          <MenuItem icon="❓" label="Help & Support" onPress={() => {}} />
        </View>

        {/* App info */}
        <View className="items-center py-8">
          <Text className="text-gray-400 text-sm">ButterNovel v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
