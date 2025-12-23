import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useState } from "react";

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <BlurView
        intensity={80}
        tint="dark"
        className="absolute top-0 left-0 right-0 z-10"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between py-3 px-4">
          <Pressable>
            <Text className="text-gray-400">Cancel</Text>
          </Pressable>
          <Text className="text-white text-lg font-bold">Create Story</Text>
          <Pressable className="bg-primary-500 px-4 py-1.5 rounded-full">
            <Text className="text-white font-semibold">Publish</Text>
          </Pressable>
        </View>
      </BlurView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: 100,
          paddingHorizontal: 16,
        }}
      >
        {/* Title Input */}
        <TextInput
          className="text-white text-2xl font-bold py-4 border-b border-gray-800"
          placeholder="Story Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
        />

        {/* Content Input */}
        <TextInput
          className="text-white text-base py-4 flex-1 min-h-[300px]"
          placeholder="Write your story..."
          placeholderTextColor="#6b7280"
          multiline
          textAlignVertical="top"
          value={content}
          onChangeText={setContent}
        />

        {/* Tips */}
        <View className="bg-gray-900 rounded-xl p-4 mt-4">
          <Text className="text-primary-500 font-semibold mb-2">
            Writing Tips
          </Text>
          <Text className="text-gray-400 text-sm leading-5">
            Short stories work best when they&apos;re between 500-2000 words. Start
            with a hook that grabs attention!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
