import { StyleSheet, Text, View } from "react-native";

type Props = {
  value: string;
  label: string;
  valueColor: string;
};

export default function StatCard({ value, label, valueColor }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>

      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,

    height: 75,

    marginHorizontal: 6,

    borderRadius: 20,

    backgroundColor: "rgba(96,117,251,0.70)",

    justifyContent: "center",
    alignItems: "center",
  },

  value: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.25,
  },

  label: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#FFEEEE",
    opacity: 0.8,
    letterSpacing: 0.25,
  },
});
