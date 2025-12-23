import { View, Text, FlatList, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const mockStories = [
  { id: 1, title: "The Last Summer", author: "Emily Chen", genre: "Romance", preview: "The sun was setting..." },
  { id: 2, title: "Midnight Code", author: "Alex Wang", genre: "Thriller", preview: "The screen flickered..." },
];

export default function ForYouScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold">For You</Text>
      </View>
      <FlatList
        data={mockStories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/reader/${item.id}`)}
            className="bg-white mx-4 my-2 p-6 rounded-2xl"
          >
            <Text className="text-primary text-sm">{item.genre}</Text>
            <Text className="text-xl font-bold mt-2">{item.title}</Text>
            <Text className="text-gray-500">by {item.author}</Text>
            <Text className="text-gray-700 mt-4">{item.preview}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
