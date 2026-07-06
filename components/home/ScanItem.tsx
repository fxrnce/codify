import { StyleSheet, Text, View } from "react-native";

type Props = {
  name: string;
  status: string;
  time: string;
  color: string;
};

export default function ScanItem({ name, status, time, color }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D293D",
  },

  status: {
    marginTop: 3,
    fontSize: 13,
    color: "#8E9198",
  },

  time: {
    fontSize: 13,
    color: "#8E9198",
  },
});
