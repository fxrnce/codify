import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useScanHistory } from "@/contexts/ScanHistoryContext";

import StatCard from "./StatCard";

export default function Header() {
  const insets = useSafeAreaInsets();
  const { scanHistory } = useScanHistory();

  const totalScans = scanHistory.length;

  const approvedCount = scanHistory.filter(
    (item) => item.status === "Approved",
  ).length;

  const alertCount = scanHistory.filter(
    (item) => item.status === "Caution" || item.status === "Not Approved",
  ).length;

  return (
    <LinearGradient
      colors={["#2563EB", "#4F46E5", "#7C3AED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
        },
      ]}
    >
      <View style={styles.largeCircle} />
      <View style={styles.smallCircle} />
      <View style={styles.bottomCircle} />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.welcome}>Welcome to Codify,</Text>

          <Text style={styles.name}>Demo 👋</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>D</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          value={String(totalScans)}
          label="Total Scans"
          valueColor="#FFEEEE"
        />

        <StatCard
          value={String(approvedCount)}
          label="Approved"
          valueColor="#5EE9B5"
        />

        <StatCard
          value={String(alertCount)}
          label="Alerts"
          valueColor="#FFA2A2"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 285,
    overflow: "hidden",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 34,
  },

  welcome: {
    color: "#FFEEEE",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 0.25,
  },

  name: {
    marginTop: 6,
    color: "#FFEEEE",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.25,
  },

  avatar: {
    width: 52,
    height: 50,

    borderRadius: 18,

    backgroundColor: "#6D86FC",

    borderWidth: 1,
    borderColor: "#1D5BFB",

    opacity: 0.7,

    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#F5F5F5",
    fontSize: 18,
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 30,
    paddingHorizontal: 20,
  },

  largeCircle: {
    position: "absolute",

    width: 224,
    height: 224,

    borderRadius: 112,

    right: -48,
    top: -24,

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  smallCircle: {
    position: "absolute",

    width: 56,
    height: 56,

    borderRadius: 28,

    right: 70,
    top: 42,

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  bottomCircle: {
    position: "absolute",

    width: 192,
    height: 192,

    borderRadius: 96,

    left: -56,
    bottom: -63,

    backgroundColor: "rgba(255,255,255,0.10)",
  },
});
