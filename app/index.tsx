import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

const ONBOARDING_STORAGE_KEY = "codify_has_seen_onboarding_v2";
const AUTH_STORAGE_KEY = "codify_mock_is_signed_in";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAppStart = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(
          ONBOARDING_STORAGE_KEY,
        );

        if (hasSeenOnboarding !== "true") {
          router.replace("/onboarding" as never);
          return;
        }

        const isSignedIn = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (isSignedIn === "true") {
          router.replace("/(tabs)" as never);
        } else {
          router.replace("/auth/sign-in" as never);
        }
      } catch (error) {
        console.log("Failed to check app start:", error);
        router.replace("/auth/sign-in" as never);
      }
    };

    checkAppStart();
  }, [router]);

  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
