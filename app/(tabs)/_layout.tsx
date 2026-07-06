import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

function TabIcon({
  focused,
  icon,
  color,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={[styles.iconBox, focused && styles.activeIconBox]}>
      <Ionicons name={icon} size={22} color={focused ? "#FFFFFF" : color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#90A1B9",

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginTop: 4,
        },

        tabBarStyle: {
          height: 82,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",

          shadowColor: "#4F46E5",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.07,
          shadowRadius: 24,

          elevation: 10,

          paddingTop: 8,
          paddingBottom: 12,
        },

        tabBarItemStyle: {
          height: 62,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} icon="home-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} icon="scan-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} icon="time-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} icon="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 48,
    height: 36,
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",
  },

  activeIconBox: {
    backgroundColor: "#4F46E5",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.38,
    shadowRadius: 14,

    elevation: 8,
  },
});
