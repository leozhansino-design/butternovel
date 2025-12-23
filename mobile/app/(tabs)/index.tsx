import { View, Text, FlatList, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_HEIGHT = SCREEN_HEIGHT - 150; // Account for tab bar and status bar

// Mock data - will be replaced with API call
const mockStories = [
  {
    id: 1,
    title: "The Last Summer",
    author: "Emily Chen",
    genre: "Romance",
    preview: "The sun was setting over the old pier, casting long shadows across the weathered wooden planks. Sarah hadn't been back here in five years, not since...",
    likes: 2340,
    comments: 156,
  },
  {
    id: 2,
    title: "Midnight Code",
    author: "Alex Wang",
    genre: "Thriller",
    preview: "The screen flickered in the darkness. Three words appeared: 'They know everything.' Maya's fingers froze over the keyboard as the implications sank in...",
    likes: 1890,
    comments: 234,
  },
  {
    id: 3,
    title: "Dreams of Mars",
    author: "Jordan Lee",
    genre: "Sci-Fi",
    preview: "Colony 7 was never supposed to fail. But as Commander Chen looked out at the red dust storm approaching, she knew this might be humanity's last chance...",
    likes: 3456,
    comments: 412,
  },
];

function StoryCard({ story, onPress }: { story: typeof mockStories[0]; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white mx-4 my-2 rounded-2xl p-6 shadow-sm border border-gray-100"
      style={{ height: CARD_HEIGHT }}
    >
      <View className="flex-1">
        {/* Genre badge */}
        <View className="self-start bg-primary/10 px-3 py-1 rounded-full mb-4">
          <Text className="text-primary text-sm font-medium">{story.genre}</Text>
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900 mb-2">{story.title}</Text>

        {/* Author */}
        <Text className="text-gray-500 mb-6">by {story.author}</Text>

        {/* Preview text */}
        <Text className="text-gray-700 text-lg leading-7 flex-1">{story.preview}</Text>

        {/* Stats */}
        <View className="flex-row items-center mt-4 pt-4 border-t border-gray-100">
          <View className="flex-row items-center mr-6">
            <Text className="text-xl mr-2">❤️</Text>
            <Text className="text-gray-600">{story.likes.toLocaleString()}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">💬</Text>
            <Text className="text-gray-600">{story.comments.toLocaleString()}</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable className="bg-primary mt-4 py-4 rounded-xl items-center">
          <Text className="text-white font-semibold text-lg">Start Reading</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ForYouScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-gray-900">For You</Text>
        <Text className="text-gray-500 mt-1">Discover your next favorite story</Text>
      </View>

      {/* Story cards - vertical scroll like TikTok */}
      <FlatList
        data={mockStories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            onPress={() => router.push(`/reader/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={CARD_HEIGHT + 16}
        decelerationRate="fast"
        pagingEnabled
      />
    </SafeAreaView>
  );
}
