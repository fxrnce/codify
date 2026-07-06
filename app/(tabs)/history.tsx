import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>0 products scanned</Text>
      </View>

      <View style={styles.emptyContainer}>
        <View style={styles.iconBox}>
          <Ionicons name="scan-outline" size={48} color="#CBD5E1" />
        </View>

        <Text style={styles.emptyTitle}>No scans yet</Text>

        <Text style={styles.emptyDescription}>
          Your scan history will appear here once you start verifying products
        </Text>

        <Pressable onPress={() => {}} style={styles.buttonWrapper}>
          <LinearGradient
            colors={["#4F39F6", "#5B4CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Scan a Product</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    height: 115,
    backgroundColor: "#FFFFFF",
    paddingTop: 48,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1D293D",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: "#62748E",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 100,
  },

  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },

  emptyTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1D293D",
    marginBottom: 14,
  },

  emptyDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: "#90A1B9",
    textAlign: "center",
    marginBottom: 28,
  },

  buttonWrapper: {
    width: 170,
    height: 50,
    shadowColor: "#4F39F6",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },

  button: {
    flex: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
