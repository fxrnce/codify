import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { findProductByBarcode } from "@/constants/MockData";

const { width } = Dimensions.get("window");

const FRAME_SIZE = Math.min(width - 52, 382);
const GRID_PADDING = 16;
const GRID_GAP = 8;
const GRID_COUNT = 6;
const CELL_SIZE =
  (FRAME_SIZE - GRID_PADDING * 2 - GRID_GAP * (GRID_COUNT - 1)) / GRID_COUNT;

const GRID_ITEMS = Array.from({ length: 36 });

const sampleBarcodes = [
  {
    code: "4800011234567",
    name: "Milk Chocolate Bar",
    bg: "#ECFDF5",
    color: "#009966",
  },
  {
    code: "4800017654321",
    name: "PureGlow Facial Care",
    bg: "#FFFBEB",
    color: "#E17100",
  },
  {
    code: "0000000000000",
    name: "Energy Drink X",
    bg: "#FEF2F2",
    color: "#E7000B",
  },
];

export default function ScannerScreen() {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");

  const handleDemoScan = () => {
    setBarcode("4800011234567");

    Alert.alert(
      "Demo Scan",
      "Demo barcode added. Tap Verify Product to check the result.",
    );
  };

  const handleVerifyProduct = () => {
    const cleanedBarcode = barcode.trim();

    if (!cleanedBarcode) {
      Alert.alert("No barcode entered", "Please enter or select a barcode.");
      return;
    }

    const product = findProductByBarcode(cleanedBarcode);

    if (!product) {
      Alert.alert(
        "Product Not Found",
        "This barcode is not available in the demo database yet.",
      );
      return;
    }

    router.push({
      pathname: "/product-result/[barcode]",
      params: {
        barcode: product.barcode,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner</Text>
        <Text style={styles.subtitle}>Scan or enter a barcode to verify</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.scannerFrame}>
          <View style={styles.grid}>
            {GRID_ITEMS.map((_, index) => (
              <View key={index} style={styles.gridBox} />
            ))}
          </View>

          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <View style={styles.centerScan}>
            <Ionicons
              name="scan-outline"
              size={92}
              color="rgba(255,255,255,0.32)"
            />
            <View style={styles.horizontalLine} />
          </View>

          <View style={styles.frameTextBox}>
            <Text style={styles.frameText}>Position barcode in frame</Text>
          </View>
        </View>

        <Pressable onPress={handleDemoScan} style={styles.scanButtonWrapper}>
          <LinearGradient
            colors={["#4F39F6", "#155DFC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanButton}
          >
            <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Tap to Scan</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.manualInputContainer}>
          <Ionicons
            name="barcode-outline"
            size={22}
            color="#90A1B9"
            style={styles.manualInputIcon}
          />

          <TextInput
            value={barcode}
            onChangeText={setBarcode}
            placeholder="Enter barcode number"
            placeholderTextColor="#90A1B9"
            keyboardType="numeric"
            style={styles.manualInput}
          />
        </View>

        <Pressable
          onPress={handleVerifyProduct}
          style={({ pressed }) => [
            styles.verifyButton,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.verifyButtonText}>Verify Product</Text>
        </Pressable>

        <View style={styles.sampleCard}>
          <View style={styles.sampleHeader}>
            <Ionicons name="alert-circle-outline" size={18} color="#4F39F6" />
            <Text style={styles.sampleTitle}>SAMPLE BARCODES</Text>
          </View>

          {sampleBarcodes.map((item) => (
            <Pressable
              key={item.code}
              style={({ pressed }) => [
                styles.sampleRow,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setBarcode(item.code)}
            >
              <Text style={styles.sampleCode}>{item.code}</Text>

              <View style={[styles.samplePill, { backgroundColor: item.bg }]}>
                <Text style={[styles.sampleName, { color: item.color }]}>
                  {item.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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

  content: {
    paddingTop: 18,
    paddingBottom: 28,
    alignItems: "center",
  },

  scannerFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 24,
    backgroundColor: "#0F172B",
    overflow: "hidden",

    shadowColor: "#0F172B",
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 12,
  },

  grid: {
    position: "absolute",
    top: GRID_PADDING,
    left: GRID_PADDING,
    right: GRID_PADDING,
    bottom: GRID_PADDING,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    opacity: 0.1,
  },

  gridBox: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },

  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#7C86FF",
  },

  topLeft: {
    left: 32,
    top: 32,
    borderTopWidth: 1.2,
    borderLeftWidth: 1.2,
    borderTopLeftRadius: 14,
  },

  topRight: {
    right: 32,
    top: 32,
    borderTopWidth: 1.2,
    borderRightWidth: 1.2,
    borderTopRightRadius: 14,
  },

  bottomLeft: {
    left: 32,
    bottom: 32,
    borderBottomWidth: 1.2,
    borderLeftWidth: 1.2,
    borderBottomLeftRadius: 14,
  },

  bottomRight: {
    right: 32,
    bottom: 32,
    borderBottomWidth: 1.2,
    borderRightWidth: 1.2,
    borderBottomRightRadius: 14,
  },

  centerScan: {
    position: "absolute",
    top: 116,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  horizontalLine: {
    position: "absolute",
    width: 46,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.32)",
  },

  frameTextBox: {
    position: "absolute",
    top: 260,
    alignSelf: "center",
    width: 202,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  frameText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.7)",
  },

  scanButtonWrapper: {
    width: FRAME_SIZE,
    height: 56,
    marginTop: 20,
    shadowColor: "#C6D2FF",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },

  scanButton: {
    flex: 1,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  scanButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  manualInputContainer: {
    width: FRAME_SIZE,
    height: 54,
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  manualInputIcon: {
    marginRight: 12,
  },

  manualInput: {
    flex: 1,
    fontSize: 16,
    color: "#1D293D",
    paddingVertical: 0,
  },

  verifyButton: {
    width: FRAME_SIZE,
    height: 52,
    marginTop: 12,
    backgroundColor: "#1D293D",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },

  sampleCard: {
    width: FRAME_SIZE,
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#EEF3FF",
    borderWidth: 1,
    borderColor: "#DDE7FF",
  },

  sampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  sampleTitle: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#4F39F6",
    letterSpacing: 0.4,
  },

  sampleRow: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sampleCode: {
    fontSize: 14,
    color: "#62748E",
    fontWeight: "500",
  },

  samplePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },

  sampleName: {
    fontSize: 13,
    fontWeight: "600",
  },
});
