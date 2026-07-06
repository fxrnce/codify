import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import HistoryIcon from "@/assets/icons/history.svg";
import HomeIcon from "@/assets/icons/home.svg";
import ProfileIcon from "@/assets/icons/profile.svg";
import ScannerIcon from "@/assets/icons/scanner.svg";

type TabIconProps = {
  focused: boolean;
  Icon: React.FC<any>;
};

function TabIcon({ focused, Icon }: { focused: boolean; Icon: React.FC<any> }) {
  const iconColor = focused ? "#FFFFFF" : "#90A1B9";

  return (
    <View style={[styles.iconBox, focused && styles.activeIconBox]}>
      <Icon
        width={22}
        height={22}
        color={iconColor}
        stroke={iconColor}
        fill="none"
      />
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
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={HomeIcon} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scanner",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={ScannerIcon} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={HistoryIcon} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={ProfileIcon} />
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
