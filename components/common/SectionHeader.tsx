import Colors from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  action?: string;
  onPress?: () => void;
};

export default function SectionHeader({ title, action, onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {action ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  action: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
