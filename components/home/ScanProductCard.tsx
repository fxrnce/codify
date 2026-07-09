import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Card from "@/components/common/Card";

import ScanIllustration from "./scan-product/ScanIllustration";
import { styles } from "./scan-product/styles";

export default function ScanProductCard() {
  const router = useRouter();

  const goToScanner = () => {
    router.push("/scanner");
  };

  const goToSearch = () => {
    router.push("/search-product" as never);
  };

  return (
    <Card
      style={{
        marginHorizontal: 16,
        marginTop: 16,
      }}
    >
      <View style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.title}>Scan a Product</Text>

          <Text style={styles.description}>
            Verify authenticity instantly by scanning the product barcode or QR
            code.
          </Text>

          <View style={localStyles.actionRow}>
            <Pressable style={localStyles.scanButton} onPress={goToScanner}>
              <Text style={localStyles.scanButtonText}>Scan Now</Text>
            </Pressable>

            <Pressable style={localStyles.searchButton} onPress={goToSearch}>
              <Text style={localStyles.searchButtonText}>Search</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.right}>
          <ScanIllustration />
        </View>
      </View>
    </Card>
  );
}

const localStyles = StyleSheet.create({
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  scanButton: {
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#4F39F6",
    justifyContent: "center",
    alignItems: "center",
  },

  scanButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  searchButton: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  searchButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#4F39F6",
  },
});
