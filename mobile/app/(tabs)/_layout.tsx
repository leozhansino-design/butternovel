import { Tabs } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "For You",
          tabBarIcon: () => null, // No icon, text only
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: "Following",
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: () => (
            <View className="bg-primary-500 rounded-lg px-4 py-1 -mt-1">
              <Text className="text-white text-2xl font-bold">+</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookshelf"
        options={{
          title: "Bookshelf",
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
