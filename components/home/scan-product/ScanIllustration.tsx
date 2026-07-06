import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

export default function ScanIllustration() {
  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      {/* Phone */}
      <View style={styles.phone}>
        <Ionicons name="phone-portrait" size={42} color={Colors.primary} />
      </View>

      {/* QR Badge */}
      <View style={styles.qrBadge}>
        <Ionicons name="qr-code" size={22} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
  },

  phone: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  qrBadge: {
    position: "absolute",
    right: 8,
    bottom: 14,

    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: Colors.primary,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  circle: {
    position: "absolute",
    backgroundColor: "#EDE9FE",
    borderRadius: 999,
  },

  circleTop: {
    width: 16,
    height: 16,
    top: 18,
    left: 18,
  },

  circleBottom: {
    width: 10,
    height: 10,
    bottom: 24,
    left: 30,
  },
});
