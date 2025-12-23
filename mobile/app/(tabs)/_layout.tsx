import { Tabs } from "expo-router";
import { View, Text } from "react-native";

// Simple icon component (can be replaced with expo-icons later)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    "for-you": "🏠",
    following: "👥",
    create: "➕",
    bookshelf: "📚",
    profile: "👤",
  };

  return (
    <View className="items-center justify-center">
      <Text className={`text-2xl ${focused ? "opacity-100" : "opacity-50"}`}>
        {icons[name] || "•"}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "For You",
          tabBarIcon: ({ focused }) => <TabIcon name="for-you" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="following"
        options={{
          title: "Following",
          tabBarIcon: ({ focused }) => <TabIcon name="following" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => <TabIcon name="create" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookshelf"
        options={{
          title: "Bookshelf",
          tabBarIcon: ({ focused }) => <TabIcon name="bookshelf" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
