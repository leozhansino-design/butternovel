import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

const GENRES = [
  "Romance",
  "Fantasy",
  "Thriller",
  "Sci-Fi",
  "Horror",
  "Mystery",
  "Drama",
  "Comedy",
  "Action",
  "Slice of Life",
  "Historical",
  "Supernatural",
];

export default function CreateScreen() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [content, setContent] = useState("");

  const charCount = content.length;
  const minChars = 15000;
  const maxChars = 50000;
  const isValidLength = charCount >= minChars && charCount <= maxChars;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-gray-900">Create</Text>
          <Text className="text-gray-500 mt-1">Share your story with the world</Text>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Title */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter your story title"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Genre */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {GENRES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGenre(g)}
                    className={`px-4 py-2 rounded-full border ${
                      genre === g
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={genre === g ? "text-white font-medium" : "text-gray-700"}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Content */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium">Story Content</Text>
              <Text
                className={`text-sm ${
                  isValidLength ? "text-green-600" : charCount > maxChars ? "text-red-600" : "text-gray-500"
                }`}
              >
                {charCount.toLocaleString()} / {minChars.toLocaleString()}-{maxChars.toLocaleString()}
              </Text>
            </View>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Start writing your story..."
              multiline
              numberOfLines={20}
              textAlignVertical="top"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[400px]"
              placeholderTextColor="#9CA3AF"
            />

            {/* Character count guide */}
            <View className="mt-2 p-3 bg-blue-50 rounded-lg">
              <Text className="text-blue-700 text-sm">
                📝 Short stories should be between {minChars.toLocaleString()} and {maxChars.toLocaleString()} characters
              </Text>
            </View>
          </View>

          {/* Submit button */}
          <Pressable
            className={`py-4 rounded-xl items-center mb-8 ${
              title && genre && isValidLength ? "bg-primary" : "bg-gray-300"
            }`}
            disabled={!title || !genre || !isValidLength}
          >
            <Text className="text-white font-semibold text-lg">Publish Story</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
