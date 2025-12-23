import { View, Text, Pressable, Dimensions, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ShortNovelListItem } from "@/types";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface ShortNovelCardProps {
  novel: ShortNovelListItem;
  isActive: boolean;
  onReadMore: () => void;
}

export function ShortNovelCard({ novel, isActive, onReadMore }: ShortNovelCardProps) {
  const insets = useSafeAreaInsets();

  // Format view count
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View
      className="bg-gray-950"
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
    >
      {/* Background gradient based on genre */}
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: getGenreColor(novel.shortNovelGenre || novel.category.name),
          opacity: 0.15,
        }}
      />

      {/* Content */}
      <View
        className="flex-1 justify-end"
        style={{
          paddingTop: insets.top + 60,
          paddingBottom: 80,
          paddingHorizontal: 16,
        }}
      >
        {/* Genre Tag */}
        <View className="flex-row mb-4">
          <BlurView intensity={40} tint="dark" className="rounded-full overflow-hidden">
            <View className="px-3 py-1">
              <Text className="text-primary-400 text-sm font-medium">
                {novel.shortNovelGenre || novel.category.name}
              </Text>
            </View>
          </BlurView>
        </View>

        {/* Title */}
        <Text className="text-white text-3xl font-bold mb-3" numberOfLines={2}>
          {novel.title}
        </Text>

        {/* Author */}
        <Text className="text-gray-400 text-base mb-4">
          by {novel.authorName}
        </Text>

        {/* Preview Text */}
        <ScrollView
          className="max-h-[280px] mb-6"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-gray-200 text-base leading-7">
            {novel.readingPreview || novel.blurb}
          </Text>
        </ScrollView>

        {/* Stats Row */}
        <View className="flex-row items-center gap-6 mb-6">
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-400">{formatCount(novel.viewCount)} views</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-400">{formatCount(novel.likeCount)} likes</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-400">{novel.wordCount.toLocaleString()} words</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 bg-primary-500 py-4 rounded-xl items-center"
            onPress={onReadMore}
          >
            <Text className="text-white font-bold text-lg">Read Full Story</Text>
          </Pressable>
          <Pressable className="bg-gray-800 px-5 py-4 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">♡</Text>
          </Pressable>
          <Pressable className="bg-gray-800 px-5 py-4 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">↗</Text>
          </Pressable>
        </View>
      </View>

      {/* Side Actions - TikTok style */}
      <View className="absolute right-4 bottom-40 items-center gap-6">
        <ActionButton icon="♡" label={formatCount(novel.likeCount)} />
        <ActionButton icon="💬" label="0" />
        <ActionButton icon="🔖" label="Save" />
        <ActionButton icon="↗" label="Share" />
      </View>
    </View>
  );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable className="items-center">
      <View className="w-12 h-12 bg-gray-800/80 rounded-full items-center justify-center mb-1">
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="text-white text-xs">{label}</Text>
    </Pressable>
  );
}

function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    "Romance": "#ec4899",
    "Fantasy": "#8b5cf6",
    "Thriller": "#ef4444",
    "Mystery": "#6366f1",
    "Sci-Fi": "#06b6d4",
    "Drama": "#f59e0b",
    "Comedy": "#22c55e",
    "Horror": "#991b1b",
    "Age Gap": "#ec4899",
    "Billionaire Romance": "#eab308",
    "Second Chance": "#f97316",
    "Enemies to Lovers": "#dc2626",
    "Fake Dating": "#a855f7",
  };

  return colors[genre] || "#3b82f6"; // Default to primary blue
}
