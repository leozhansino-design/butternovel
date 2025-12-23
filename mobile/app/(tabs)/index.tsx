import { useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  ViewToken,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ShortNovelCard } from "@/components/ShortNovelCard";
import { fetchShorts } from "@/lib/api";
import type { ShortNovel } from "@/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ForYouScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const {
    data: shorts,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["shorts"],
    queryFn: fetchShorts,
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleReadMore = useCallback(
    (id: number) => {
      router.push(`/short/${id}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-white mt-4">Loading stories...</Text>
      </View>
    );
  }

  if (isError || !shorts) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-lg text-center mb-4">
          Failed to load stories
        </Text>
        <Pressable
          className="bg-primary-500 px-6 py-3 rounded-full"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <BlurView
        intensity={80}
        tint="dark"
        className="absolute top-0 left-0 right-0 z-10"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-center py-3">
          <Text className="text-white text-lg font-bold">For You</Text>
        </View>
      </BlurView>

      {/* Vertical Scroll Feed */}
      <FlatList
        ref={flatListRef}
        data={shorts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <ShortNovelCard
            novel={item}
            isActive={index === activeIndex}
            onReadMore={() => handleReadMore(item.id)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#3b82f6"
          />
        }
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}
