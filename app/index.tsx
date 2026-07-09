import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

const ONBOARDING_STORAGE_KEY = "codify_has_seen_onboarding_v2";

export default function IndexScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    const checkAppStart = async () => {
      if (!isLoaded) {
        return;
      }

      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(
          ONBOARDING_STORAGE_KEY,
        );

        if (hasSeenOnboarding !== "true") {
          router.replace("/onboarding" as never);
          return;
        }

        if (isSignedIn) {
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
  }, [isLoaded, isSignedIn, router]);

  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
