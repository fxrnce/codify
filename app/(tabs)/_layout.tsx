import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import HistoryIcon from "@/assets/icons/history.svg";
import HomeIcon from "@/assets/icons/home.svg";
import ProfileIcon from "@/assets/icons/profile.svg";
import ScannerIcon from "@/assets/icons/scanner.svg";

const AUTH_STORAGE_KEY = "codify_mock_is_signed_in";

type TabIconProps = {
  focused: boolean;
  Icon: React.FC<any>;
};

function TabIcon({ focused, Icon }: TabIconProps) {
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
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isSignedIn = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (isSignedIn !== "true") {
          router.replace("/auth/sign-in" as never);
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.log("Failed to check auth:", error);
        router.replace("/auth/sign-in" as never);
      }
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return <View style={styles.loadingScreen} />;
  }

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
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

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
