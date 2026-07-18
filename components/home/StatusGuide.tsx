import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import Card from "@/components/common/Card";
import StatusItem from "./StatusItem";

export default function StatusGuide() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#4F46E5" />
        </View>

        <Text style={styles.title}>FDA Status Guide</Text>
      </View>

      <View style={styles.list}>
        <StatusItem
          type="approved"
          title="FDA Approved"
          description="Registered & verified by Philippine FDA"
        />

        <StatusItem
          type="warning"
          title="Caution"
          description="Registered but has health/safety concerns"
        />

        <StatusItem
          type="danger"
          title="FDA Advisory"
          description="Covered by an official FDA warning — avoid purchasing"
        />

        <StatusItem
          type="unverified"
          title="Unverified"
          description="Exact barcode or market variant has not been matched"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,

    marginTop: 16,

    padding: 17,

    borderRadius: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 12,
  },

  iconContainer: {
    width: 24,
    height: 24,

    borderRadius: 10,

    backgroundColor: "#EEF2FF",

    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginLeft: 8,

    fontSize: 14,
    fontWeight: "700",

    color: "#1D293D",
  },

  list: {
    gap: 8,
  },
});
