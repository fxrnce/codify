import { findProductByBarcode } from "@/constants/MockData";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const REPORTS_STORAGE_KEY = "codify_product_reports";

const REPORT_REASONS = [
  "No FDA record found",
  "Wrong product information",
  "Suspicious product",
  "Possible counterfeit",
  "Other concern",
];

type ProductReport = {
  id: string;
  barcode: string;
  productName: string;
  brand: string;
  category: string;
  reason: string;
  notes: string;
  submittedAt: string;
};

export default function ReportProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string }>();

  const barcode = params.barcode ?? "";
  const product = findProductByBarcode(barcode);

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!product) {
      return;
    }

    setProductName(product.name);
    setBrand(product.brand);
    setCategory(product.category);

    if (product.status === "Approved") {
      setSelectedReason("Wrong product information");
      return;
    }

    if (product.status === "Caution") {
      setSelectedReason("Suspicious product");
      return;
    }

    setSelectedReason("No FDA record found");
  }, [product]);

  const goBack = () => {
    router.back();
  };

  const submitReport = async () => {
    if (isSubmitting) {
      return;
    }

    const cleanedProductName = productName.trim();
    const cleanedBrand = brand.trim();
    const cleanedCategory = category.trim();
    const cleanedNotes = notes.trim();

    if (!cleanedProductName) {
      Alert.alert("Product Name Required", "Please enter the product name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newReport: ProductReport = {
        id: `${barcode || "no-barcode"}-${Date.now()}`,
        barcode: barcode || "No barcode",
        productName: cleanedProductName,
        brand: cleanedBrand || "Unknown Brand",
        category: cleanedCategory || "Uncategorized",
        reason: selectedReason,
        notes: cleanedNotes,
        submittedAt: new Date().toISOString(),
      };

      const savedReports = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
      const currentReports: ProductReport[] = savedReports
        ? JSON.parse(savedReports)
        : [];

      const reportsWithoutSameBarcode = currentReports.filter(
        (report) => report.barcode !== newReport.barcode,
      );

      const updatedReports = [newReport, ...reportsWithoutSameBarcode];

      await AsyncStorage.setItem(
        REPORTS_STORAGE_KEY,
        JSON.stringify(updatedReports),
      );

      Alert.alert(
        "Report Submitted",
        "Your report has been saved locally for review. Backend submission will be connected later.",
        [
          {
            text: "View Reports",
            onPress: () =>
              router.replace({
                pathname: "/reported-products",
                params: {
                  from: "report-submitted",
                },
              }),
          },
          {
            text: "OK",
          },
        ],
      );
    } catch (error) {
      console.log("Failed to save product report:", error);

      Alert.alert(
        "Save Failed",
        "Something went wrong while saving your report. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#FB2C36", "#E7000B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.largeCircle} />
        <View style={styles.bottomCircle} />

        <View style={styles.topRow}>
          <Pressable style={styles.headerButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerIconBox}>
            <Ionicons name="flag-outline" size={18} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>REPORT PRODUCT</Text>
          <Text style={styles.headerTitle}>Help verify this item</Text>
          <Text style={styles.headerSubtitle}>
            Submit product details so it can be checked later.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warningCard}>
          <View style={styles.warningIconBox}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#E7000B"
            />
          </View>

          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>Unverified product</Text>
            <Text style={styles.warningText}>
              This form is for products that are missing, suspicious, or need
              manual FDA verification.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Barcode Information</Text>

          <View style={styles.barcodeBox}>
            <Ionicons name="barcode-outline" size={20} color="#4F46E5" />
            <Text style={styles.barcodeText}>{barcode || "No barcode"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder="Example: Energy Drink"
              placeholderTextColor="#90A1B9"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Brand</Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="Example: Unknown Brand"
              placeholderTextColor="#90A1B9"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Example: Beverage, Cosmetic, Medicine"
              placeholderTextColor="#90A1B9"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reason for Report</Text>

          <View style={styles.reasonList}>
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;

              return (
                <Pressable
                  key={reason}
                  style={[
                    styles.reasonButton,
                    isSelected && styles.reasonButtonSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>

                  <Text
                    style={[
                      styles.reasonText,
                      isSelected && styles.reasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Notes</Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any details about the product, label, store, or concern..."
            placeholderTextColor="#90A1B9"
            multiline
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </View>

        <Pressable
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={submitReport}
        >
          <Ionicons name="send-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>
            {isSubmitting ? "Saving Report..." : "Submit Report"}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={goBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    height: 250,
    paddingTop: 48,
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  largeCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -16,
    top: -32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  bottomCircle: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    left: -40,
    bottom: -39,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerContent: {
    marginTop: 34,
  },

  headerLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.7)",
  },

  headerTitle: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  headerSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.75)",
  },

  content: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },

  warningCard: {
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.17,
    borderColor: "#FFE2E2",
    padding: 16,
    flexDirection: "row",
  },

  warningIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFE2E2",
    justifyContent: "center",
    alignItems: "center",
  },

  warningTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  warningTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
    color: "#C10007",
  },

  warningText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: "#E7000B",
  },

  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.8)",
    padding: 18,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "800",
    color: "#1D293D",
  },

  barcodeBox: {
    marginTop: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  barcodeText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#4F39F6",
  },

  inputGroup: {
    marginTop: 14,
  },

  inputLabel: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#45556C",
  },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1D293D",
  },

  reasonList: {
    marginTop: 14,
    gap: 10,
  },

  reasonButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  reasonButtonSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },

  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },

  radioCircleSelected: {
    borderColor: "#4F46E5",
  },

  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
  },

  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#62748E",
  },

  reasonTextSelected: {
    color: "#4F46E5",
  },

  notesInput: {
    marginTop: 14,
    minHeight: 120,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: "#1D293D",
  },

  submitButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#4F39F6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,

    shadowColor: "#C6D2FF",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  cancelButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#62748E",
  },
});
