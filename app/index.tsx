import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

const ONBOARDING_STORAGE_KEY = "codify_has_seen_onboarding_v2";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkFirstOpen = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(
          ONBOARDING_STORAGE_KEY,
        );

        if (hasSeenOnboarding === "true") {
          router.replace("/(tabs)" as never);
        } else {
          router.replace("/onboarding" as never);
        }
      } catch (error) {
        console.log("Failed to check onboarding:", error);
        router.replace("/(tabs)" as never);
      }
    };

    checkFirstOpen();
  }, [router]);

  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#4F46E5",
  },
});
