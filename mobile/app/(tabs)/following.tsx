import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Mock data - will be replaced with API call
const mockUpdates = [
  {
    id: 1,
    author: "Emily Chen",
    storyTitle: "The Last Summer - Chapter 12",
    storyId: 1,
    timeAgo: "2 hours ago",
    isNew: true,
  },
  {
    id: 2,
    author: "Alex Wang",
    storyTitle: "Midnight Code - Final Chapter",
    storyId: 2,
    timeAgo: "5 hours ago",
    isNew: true,
  },
  {
    id: 3,
    author: "Jordan Lee",
    storyTitle: "Dreams of Mars - Chapter 8",
    storyId: 3,
    timeAgo: "1 day ago",
    isNew: false,
  },
];

function UpdateItem({ item, onPress }: { item: typeof mockUpdates[0]; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mx-4 my-2 p-4 rounded-xl border ${item.isNew ? "bg-primary/5 border-primary/20" : "bg-white border-gray-100"}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {/* Author avatar placeholder */}
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Text className="text-primary font-bold">{item.author[0]}</Text>
            </View>
            <View>
              <Text className="font-semibold text-gray-900">{item.author}</Text>
              <Text className="text-gray-500 text-sm">{item.timeAgo}</Text>
            </View>
            {item.isNew && (
              <View className="ml-2 bg-primary px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-medium">NEW</Text>
              </View>
            )}
          </View>

          <Text className="text-gray-700">{item.storyTitle}</Text>
        </View>

        <Text className="text-gray-400 text-2xl">›</Text>
      </View>
    </Pressable>
  );
}

export default function FollowingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-gray-900">Following</Text>
        <Text className="text-gray-500 mt-1">Updates from authors you follow</Text>
      </View>

      {mockUpdates.length > 0 ? (
        <FlatList
          data={mockUpdates}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UpdateItem
              item={item}
              onPress={() => router.push(`/reader/${item.storyId}`)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">No updates yet</Text>
          <Text className="text-gray-500 text-center">
            Follow your favorite authors to see their latest stories here
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
