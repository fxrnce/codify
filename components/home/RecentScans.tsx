import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Card from "@/components/common/Card";
import { ScanHistoryItem, useScanHistory } from "@/contexts/ScanHistoryContext";

function getStatusStyle(status: ScanHistoryItem["status"]) {
  if (status === "Approved") {
    return {
      bg: "#ECFDF5",
      color: "#009966",
      icon: "checkmark-circle" as const,
      label: "Approved",
    };
  }

  if (status === "Caution") {
    return {
      bg: "#FFFBEB",
      color: "#E17100",
      icon: "warning" as const,
      label: "Caution",
    };
  }

  return {
    bg: "#FEF2F2",
    color: "#E7000B",
    icon: "close-circle" as const,
    label: "Unsafe",
  };
}

function formatScanTime(dateValue: string) {
  const date = new Date(dateValue);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RecentScans() {
  const router = useRouter();
  const { scanHistory } = useScanHistory();

  const latestScans = scanHistory.slice(0, 3);

  const goToHistory = () => {
    router.push("/history");
  };

  const openProductResult = (barcode: string) => {
    router.push({
      pathname: "/product-result/[barcode]",
      params: {
        barcode,
        from: "history",
      },
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Scans</Text>

        <Pressable onPress={goToHistory}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      {latestScans.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="scan-outline" size={22} color="#90A1B9" />
          </View>

          <View style={styles.emptyTextBox}>
            <Text style={styles.emptyTitle}>No recent scans yet</Text>
            <Text style={styles.emptyText}>
              Scanned products will appear here.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {latestScans.map((scan) => {
            const statusStyle = getStatusStyle(scan.status);

            return (
              <Pressable
                key={scan.id}
                style={({ pressed }) => [
                  styles.scanRow,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => openProductResult(scan.barcode)}
              >
                <View
                  style={[
                    styles.statusIconBox,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Ionicons
                    name={statusStyle.icon}
                    size={18}
                    color={statusStyle.color}
                  />
                </View>

                <View style={styles.scanInfo}>
                  <Text numberOfLines={1} style={styles.scanName}>
                    {scan.name}
                  </Text>

                  <Text numberOfLines={1} style={styles.scanMeta}>
                    {scan.brand} • {formatScanTime(scan.scannedAt)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusStyle.color }]}
                  >
                    {statusStyle.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D293D",
  },

  viewAll: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B4CF6",
  },

  list: {
    marginTop: 2,
  },

  scanRow: {
    minHeight: 58,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  statusIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  scanInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  scanName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1D293D",
  },

  scanMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  statusPill: {
    minHeight: 25,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  emptyBox: {
    marginTop: 8,
    minHeight: 72,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
  },

  emptyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  emptyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1D293D",
  },

  emptyText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },
});
