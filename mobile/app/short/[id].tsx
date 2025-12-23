import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { fetchShortById } from "@/lib/api";

export default function ShortDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: novel, isLoading, isError } = useQuery({
    queryKey: ["short", id],
    queryFn: () => fetchShortById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isError || !novel) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-lg text-center mb-4">
          Failed to load story
        </Text>
        <Pressable
          className="bg-primary-500 px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const chapter = novel.chapters?.[0];
  const content = chapter?.content || novel.blurb;

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
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary-500 text-lg">← Back</Text>
          </Pressable>
          <Text className="text-white text-lg font-bold flex-1 text-center mx-4" numberOfLines={1}>
            {novel.title}
          </Text>
          <Pressable>
            <Text className="text-primary-500">Share</Text>
          </Pressable>
        </View>
      </BlurView>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <Text className="text-white text-2xl font-bold mb-2">
          {novel.title}
        </Text>
        <Text className="text-gray-400 mb-4">
          by {novel.authorName}
        </Text>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          <View className="bg-primary-500/20 px-3 py-1 rounded-full">
            <Text className="text-primary-400 text-sm">
              {novel.shortNovelGenre || novel.category.name}
            </Text>
          </View>
          {novel.tags?.slice(0, 3).map((tag) => (
            <View key={tag.id} className="bg-gray-800 px-3 py-1 rounded-full">
              <Text className="text-gray-400 text-sm">{tag.name}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View className="flex-row gap-4 mb-6 pb-6 border-b border-gray-800">
          <Text className="text-gray-500">
            {novel.viewCount.toLocaleString()} views
          </Text>
          <Text className="text-gray-500">
            {novel.likeCount.toLocaleString()} likes
          </Text>
          <Text className="text-gray-500">
            {novel.wordCount.toLocaleString()} words
          </Text>
        </View>

        {/* Story Content */}
        <View>
          {content.split("\n").map((paragraph, index) => (
            paragraph.trim() && (
              <Text
                key={index}
                className="text-gray-200 text-lg leading-8 mb-4"
              >
                {paragraph}
              </Text>
            )
          ))}
        </View>

        {/* End of Story */}
        <View className="items-center py-8 mt-8 border-t border-gray-800">
          <Text className="text-gray-500 text-lg">— The End —</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <BlurView
        intensity={80}
        tint="dark"
        className="absolute bottom-0 left-0 right-0"
        style={{ paddingBottom: insets.bottom || 16 }}
      >
        <View className="flex-row items-center justify-around py-4 px-4">
          <Pressable className="items-center">
            <Text className="text-2xl mb-1">♡</Text>
            <Text className="text-gray-400 text-xs">{novel.likeCount}</Text>
          </Pressable>
          <Pressable className="items-center">
            <Text className="text-2xl mb-1">💬</Text>
            <Text className="text-gray-400 text-xs">Comments</Text>
          </Pressable>
          <Pressable className="bg-primary-500 px-8 py-3 rounded-full">
            <Text className="text-white font-bold">Save to Library</Text>
          </Pressable>
          <Pressable className="items-center">
            <Text className="text-2xl mb-1">↗</Text>
            <Text className="text-gray-400 text-xs">Share</Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}
