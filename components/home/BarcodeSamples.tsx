import { StyleSheet, Text, View } from "react-native";

import Card from "@/components/common/Card";

const barcodes = [
  {
    code: "4800011234567",
    name: "Milk Chocolate Bar",
    color: "#10D39A",
  },
  {
    code: "4800017654321",
    name: "PureGlow Facial Cleaner",
    color: "#FDB515",
  },
  {
    code: "7891000304808",
    name: "Nescafé Tradição Forte",
    color: "#FF6363",
  },
];

export default function BarcodeSamples() {
  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>TRY THESE BARCODES</Text>

      {barcodes.map((item) => (
        <View key={item.code} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />

          <Text style={styles.code}>{item.code}</Text>

          <Text numberOfLines={1} style={styles.name}>
            {item.name}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 18,
  },

  heading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 14,
    letterSpacing: 0.4,
  },

  item: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },

  code: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#8FA1BC",
  },

  name: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
});
