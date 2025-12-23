import { View, Text, ScrollView, Pressable, TextInput, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

// Mock story data - will be replaced with API call
const mockStory = {
  id: 1,
  title: "The Last Summer",
  author: "Emily Chen",
  authorId: "user123",
  genre: "Romance",
  content: `The sun was setting over the old pier, casting long shadows across the weathered wooden planks. Sarah hadn't been back here in five years, not since that last summer when everything changed.

She remembered the way the light had danced on the water, the sound of laughter echoing across the bay. Tom had been standing right here, his hand reaching for hers, asking her to stay.

But she hadn't stayed. She had chosen the city, the career, the life that seemed so important at twenty-two. Now, at twenty-seven, she wasn't so sure anymore.

The letter had arrived three days ago. Tom's mother had written it, her handwriting shakier than Sarah remembered. "He's back," she had written. "He asks about you sometimes."

Sarah pulled the letter from her pocket, its creases worn from repeated reading. She didn't know why she had come. Maybe to find closure. Maybe to find something she had lost along the way.

The wind picked up, carrying with it the salt of the sea and memories she thought she had buried. Somewhere behind her, footsteps approached on the wooden boards.

She didn't turn around. She already knew who it was.

"Hello, Sarah."

His voice was the same. Deeper, perhaps, weathered by time like the pier itself. But unmistakably his.

"Hello, Tom."

The silence stretched between them, filled with five years of questions neither knew how to ask. Finally, he stepped up beside her, close enough that she could feel the warmth of his presence.

"You got my letter," he said. It wasn't a question.

"Your mother's letter."

A small laugh escaped him. "She always did like you better than me."

Sarah smiled despite herself. "She had good taste."

They stood there as the sun completed its descent, painting the sky in shades of orange and pink. The silence had shifted, become something more comfortable, more familiar.

"I never forgot," Tom said finally. "That summer. I never forgot any of it."

Sarah turned to look at him for the first time. The years had been kind, but they had changed him. There were lines around his eyes now, and a steadiness in his gaze that hadn't been there before.

"Neither did I," she admitted.

He reached for her hand, just as he had five years ago. But this time, there was no urgency, no desperation. Just a question, asked in silence.

This time, Sarah didn't pull away.

"Stay," he said. "Just for a while. Let's see what might have been."

The last light of the sun caught his eyes, and Sarah saw in them the same hope she felt stirring in her own heart. Maybe it wasn't too late. Maybe some things were worth coming back for.

"Okay," she said. "I'll stay."

The pier creaked beneath their feet as they walked back toward town, hands intertwined, the past and present merging into something new. Something that felt, finally, like it might be the beginning they had been waiting for all along.

THE END`,
  likes: 2340,
  comments: 156,
  rating: 4.2,
  ratingCount: 89,
};

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const paragraphs = mockStory.content.split("\n\n");

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-2xl">←</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
          {mockStory.title}
        </Text>
        <Pressable onPress={() => setIsBookmarked(!isBookmarked)} className="p-2">
          <Text className="text-2xl">{isBookmarked ? "🔖" : "📑"}</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Story header */}
        <View className="py-6 border-b border-gray-100">
          <View className="bg-primary/10 self-start px-3 py-1 rounded-full mb-3">
            <Text className="text-primary text-sm font-medium">{mockStory.genre}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">{mockStory.title}</Text>
          <Pressable className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-2">
              <Text className="text-primary font-bold">{mockStory.author[0]}</Text>
            </View>
            <Text className="text-gray-600">{mockStory.author}</Text>
          </Pressable>

          {/* Rating button at start */}
          <Pressable
            onPress={() => setShowRatingModal(true)}
            className="flex-row items-center mt-4 bg-yellow-50 px-4 py-2 rounded-lg self-start"
          >
            <Text className="text-xl mr-2">⭐</Text>
            <Text className="text-yellow-700 font-medium">
              {mockStory.rating.toFixed(1)} ({mockStory.ratingCount} ratings)
            </Text>
          </Pressable>
        </View>

        {/* Story content with paragraph comments */}
        <View className="py-6">
          {paragraphs.map((paragraph, index) => (
            <Pressable
              key={index}
              className="mb-6"
              onLongPress={() => {
                // TODO: Open paragraph comment modal
                console.log("Long press on paragraph", index);
              }}
            >
              <Text className="text-gray-800 text-lg leading-8">{paragraph}</Text>
            </Pressable>
          ))}
        </View>

        {/* End of story actions */}
        <View className="py-6 border-t border-gray-100 mb-8">
          <Text className="text-center text-gray-500 mb-6">— The End —</Text>

          {/* Rating button at end */}
          <Pressable
            onPress={() => setShowRatingModal(true)}
            className="bg-primary py-4 rounded-xl items-center mb-4"
          >
            <Text className="text-white font-semibold text-lg">Rate this Story ⭐</Text>
          </Pressable>

          {/* Like and share */}
          <View className="flex-row justify-center gap-4">
            <Pressable
              onPress={() => setIsLiked(!isLiked)}
              className={`flex-row items-center px-6 py-3 rounded-xl ${isLiked ? "bg-red-50" : "bg-gray-100"}`}
            >
              <Text className="text-xl mr-2">{isLiked ? "❤️" : "🤍"}</Text>
              <Text className={isLiked ? "text-red-600" : "text-gray-600"}>
                {(mockStory.likes + (isLiked ? 1 : 0)).toLocaleString()}
              </Text>
            </Pressable>
            <Pressable className="flex-row items-center px-6 py-3 rounded-xl bg-gray-100">
              <Text className="text-xl mr-2">💬</Text>
              <Text className="text-gray-600">{mockStory.comments}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Rate this Story</Text>
              <Pressable onPress={() => setShowRatingModal(false)}>
                <Text className="text-2xl text-gray-400">×</Text>
              </Pressable>
            </View>

            {/* Star rating */}
            <View className="flex-row justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setUserRating(star)}
                  className="mx-2"
                >
                  <Text className="text-4xl">
                    {star <= userRating ? "⭐" : "☆"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Review input */}
            <TextInput
              value={review}
              onChangeText={setReview}
              placeholder="Write a review (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 mb-6 min-h-[100px]"
              placeholderTextColor="#9CA3AF"
            />

            {/* Submit button */}
            <Pressable
              onPress={() => {
                // TODO: Submit rating via API
                setShowRatingModal(false);
              }}
              className={`py-4 rounded-xl items-center ${userRating > 0 ? "bg-primary" : "bg-gray-300"}`}
              disabled={userRating === 0}
            >
              <Text className="text-white font-semibold text-lg">Submit Rating</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
