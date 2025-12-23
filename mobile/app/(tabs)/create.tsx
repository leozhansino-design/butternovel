import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

const GENRES = ["Romance", "Fantasy", "Thriller", "Sci-Fi", "Horror", "Mystery"];

export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [content, setContent] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold">Create</Text>
        </View>
        <View className="px-6">
          <Text className="font-medium mb-2">Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Story title"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4"
          />
          <Text className="font-medium mb-2">Genre</Text>
          <ScrollView horizontal className="mb-4">
            {GENRES.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGenre(g)}
                className={`px-4 py-2 mr-2 rounded-full ${genre === g ? "bg-primary" : "bg-white border"}`}
              >
                <Text className={genre === g ? "text-white" : "text-gray-700"}>{g}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text className="font-medium mb-2">Content ({content.length}/15,000-50,000)</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Start writing..."
            multiline
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 min-h-[300px]"
          />
          <Pressable className="bg-primary py-4 rounded-xl mt-4 items-center">
            <Text className="text-white font-semibold">Publish</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
