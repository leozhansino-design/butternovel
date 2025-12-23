import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

// Mock data - will be replaced with API call
const mockLibrary = [
  {
    id: 1,
    title: "The Last Summer",
    author: "Emily Chen",
    genre: "Romance",
    progress: 75,
    lastRead: "2 hours ago",
  },
  {
    id: 2,
    title: "Midnight Code",
    author: "Alex Wang",
    genre: "Thriller",
    progress: 30,
    lastRead: "Yesterday",
  },
  {
    id: 3,
    title: "Dreams of Mars",
    author: "Jordan Lee",
    genre: "Sci-Fi",
    progress: 100,
    lastRead: "3 days ago",
  },
];

type FilterType = "all" | "reading" | "completed";

function BookItem({ item, onPress }: { item: typeof mockLibrary[0]; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 my-2 p-4 bg-white rounded-xl border border-gray-100"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          {/* Genre badge */}
          <View className="self-start bg-primary/10 px-2 py-0.5 rounded-full mb-2">
            <Text className="text-primary text-xs font-medium">{item.genre}</Text>
          </View>

          <Text className="text-lg font-semibold text-gray-900">{item.title}</Text>
          <Text className="text-gray-500 text-sm">by {item.author}</Text>

          {/* Progress bar */}
          <View className="mt-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-500 text-xs">Progress</Text>
              <Text className="text-gray-500 text-xs">{item.progress}%</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${item.progress === 100 ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${item.progress}%` }}
              />
            </View>
          </View>

          <Text className="text-gray-400 text-xs mt-2">Last read: {item.lastRead}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function BookshelfScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredLibrary = mockLibrary.filter((item) => {
    if (filter === "reading") return item.progress < 100;
    if (filter === "completed") return item.progress === 100;
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-gray-900">Bookshelf</Text>
        <Text className="text-gray-500 mt-1">Your saved stories</Text>
      </View>

      {/* Filter tabs */}
      <View className="flex-row px-6 mb-4">
        {(["all", "reading", "completed"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`mr-3 px-4 py-2 rounded-full ${filter === f ? "bg-primary" : "bg-white border border-gray-200"}`}
          >
            <Text className={filter === f ? "text-white font-medium" : "text-gray-700"}>
              {f === "all" ? "All" : f === "reading" ? "Reading" : "Completed"}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredLibrary.length > 0 ? (
        <FlatList
          data={filteredLibrary}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <BookItem item={item} onPress={() => router.push(`/reader/${item.id}`)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📚</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">No stories yet</Text>
          <Text className="text-gray-500 text-center">
            Add stories to your bookshelf to read them anytime
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
