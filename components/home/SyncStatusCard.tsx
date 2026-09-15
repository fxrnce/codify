import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useNetworkStatus } from "@/contexts/NetworkContext";

function formatSyncTime(value: string | null) {
  if (!value) return "Bundled catalog available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved catalog available";

  return `Catalog last updated ${date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function SyncStatusCard() {
  const {
    connectionStatus,
    isSyncing,
    lastCatalogSyncAt,
    refreshConnection,
  } = useNetworkStatus();
  const isOnline = connectionStatus === "online";
  const isChecking = connectionStatus === "checking";
  const color = isOnline ? "#009966" : isChecking ? "#4F46E5" : "#475569";
  const backgroundColor = isOnline
    ? "#ECFDF5"
    : isChecking
      ? "#EEF2FF"
      : "#F1F5F9";
  const title = isChecking
    ? "Checking connection"
    : isOnline
      ? isSyncing
        ? "Online · synchronizing"
        : "Online"
      : "Offline mode";
  const detail = isOnline
    ? isSyncing
      ? "Updating catalogs and sending saved changes."
      : formatSyncTime(lastCatalogSyncAt)
    : `${formatSyncTime(lastCatalogSyncAt)} · Changes will sync when the server returns.`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Refresh connection status"
      onPress={() => void refreshConnection()}
      style={[styles.card, { backgroundColor }]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons
          name={
            isChecking || isSyncing
              ? "sync-outline"
              : isOnline
                ? "cloud-done-outline"
                : "cloud-offline-outline"
          }
          size={19}
          color={color}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Ionicons name="refresh-outline" size={17} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  title: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  detail: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
  },
});
