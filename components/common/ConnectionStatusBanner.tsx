import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNetworkStatus } from "@/contexts/NetworkContext";

export default function ConnectionStatusBanner() {
  const insets = useSafeAreaInsets();
  const { connectionStatus, isSyncing } = useNetworkStatus();

  if (connectionStatus === "online" && !isSyncing) {
    return null;
  }

  const isOffline = connectionStatus === "offline";
  const message = isOffline
    ? "Offline · saved data available"
    : isSyncing
      ? "Synchronizing saved data…"
      : "Checking connection…";

  return (
    <View
      pointerEvents="none"
      style={[
        styles.banner,
        { top: insets.top + 7 },
        isOffline ? styles.offlineBanner : styles.syncingBanner,
      ]}
    >
      <Ionicons
        name={isOffline ? "cloud-offline-outline" : "sync-outline"}
        size={14}
        color="#FFFFFF"
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    zIndex: 1000,
    alignSelf: "center",
    minHeight: 30,
    maxWidth: 260,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 8,
  },
  offlineBanner: { backgroundColor: "#475569" },
  syncingBanner: { backgroundColor: "#4F46E5" },
  text: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
