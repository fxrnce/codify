import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Card from "@/components/common/Card";
import { recentScans } from "@/constants/MockData";
import ScanItem from "./ScanItem";

export default function RecentScans() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Scans</Text>

        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {recentScans.map((scan) => (
          <ScanItem
            key={scan.id}
            name={scan.name}
            status={scan.status}
            time={scan.time}
            color={scan.color}
          />
        ))}
      </View>
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
});
