import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  PRODUCT_REPORT_REASONS,
  type ProductReportReason,
  useProductReports,
} from "@/contexts/ProductReportsContext";
import {
  MAX_EVIDENCE_IMAGES,
  captureEvidenceFromCamera,
  deleteLocalEvidence,
  deleteLocalEvidenceFile,
  pickEvidenceFromLibrary,
  type PendingEvidenceImage,
} from "@/services/report-evidence";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type ReportProductDetails = {
  name: string;
  brand: string;
  category: string;
  status: "Approved" | "Caution" | "FDA Advisory" | "Unverified";
};

type ProductLookupApiResponse = {
  product?: ReportProductDetails;
};

export default function ReportProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string }>();
  const { submitReport: submitProductReport } = useProductReports();

  const barcode = params.barcode ?? "";

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [selectedReason, setSelectedReason] = useState<ProductReportReason>(
    PRODUCT_REPORT_REASONS[0],
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draftId] = useState(
    () => `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [pendingImages, setPendingImages] = useState<PendingEvidenceImage[]>(
    [],
  );
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    return () => {
      // The draft's local photo folder is only meaningful until the report
      // is either submitted (ownership passes to the sync layer) or the
      // user navigates away without submitting.
      if (!hasSubmittedRef.current) {
        deleteLocalEvidence(draftId);
      }
    };
  }, [draftId]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProductDetails = async () => {
      if (!barcode || !API_URL) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/products/${encodeURIComponent(barcode)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const responseBody = (await response
          .json()
          .catch(() => ({}))) as ProductLookupApiResponse;

        if (!responseBody.product) {
          return;
        }

        const product = responseBody.product;

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
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.log("Failed to load report product details:", error);
      }
    };

    void loadProductDetails();

    return () => {
      controller.abort();
    };
  }, [barcode]);

  const goBack = () => {
    router.back();
  };

  const offerToOpenSettings = () => {
    Alert.alert(
      "Permission Needed",
      "Codify needs permission to add a photo. You can allow it in your device settings.",
      [
        { text: "Not Now", style: "cancel" },
        { text: "Open Settings", onPress: () => void Linking.openSettings() },
      ],
    );
  };

  const applyPickOutcome = (
    outcome: Awaited<ReturnType<typeof pickEvidenceFromLibrary>>,
    replaceIndex?: number,
  ) => {
    if (outcome.status === "cancelled") {
      return;
    }

    if (outcome.status === "permission-denied") {
      offerToOpenSettings();
      return;
    }

    if (outcome.status === "error") {
      Alert.alert("Could Not Add Photo", outcome.message);
      return;
    }

    if (outcome.images.length === 0) {
      if (outcome.skippedOversized > 0) {
        Alert.alert(
          "Photo Too Large",
          "That photo could not be resized under the upload limit. Please try a different photo.",
        );
      }
      return;
    }

    setPendingImages((current) => {
      const picked = outcome.images[0];

      if (replaceIndex !== undefined) {
        const previous = current[replaceIndex];
        if (previous) {
          deleteLocalEvidenceFile(previous.localUri);
        }

        const next = [...current];
        next[replaceIndex] = { ...picked, position: replaceIndex };
        return next;
      }

      return [...current, ...outcome.images].map((image, index) => ({
        ...image,
        position: index,
      }));
    });

    if (outcome.skippedOversized > 0) {
      Alert.alert(
        "Some Photos Skipped",
        `${outcome.skippedOversized} photo(s) could not be resized under the upload limit and were skipped.`,
      );
    }
  };

  const handleAddFromLibrary = async () => {
    if (isPickingPhoto || pendingImages.length >= MAX_EVIDENCE_IMAGES) {
      return;
    }

    setIsPickingPhoto(true);
    try {
      const outcome = await pickEvidenceFromLibrary(
        draftId,
        MAX_EVIDENCE_IMAGES - pendingImages.length,
      );
      applyPickOutcome(outcome);
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleAddFromCamera = async () => {
    if (isPickingPhoto || pendingImages.length >= MAX_EVIDENCE_IMAGES) {
      return;
    }

    setIsPickingPhoto(true);
    try {
      const outcome = await captureEvidenceFromCamera(draftId);
      applyPickOutcome(outcome);
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleReplaceImage = async (index: number) => {
    if (isPickingPhoto) {
      return;
    }

    setIsPickingPhoto(true);
    try {
      const outcome = await pickEvidenceFromLibrary(draftId, 1);
      applyPickOutcome(outcome, index);
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setPendingImages((current) => {
      const removed = current[index];

      if (removed) {
        deleteLocalEvidenceFile(removed.localUri);
      }

      return current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((image, position) => ({ ...image, position }));
    });
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
      const submissionResult = await submitProductReport({
        barcode,
        productName: cleanedProductName,
        brand: cleanedBrand || "Unknown Brand",
        category: cleanedCategory || "Uncategorized",
        reason: selectedReason,
        notes: cleanedNotes,
        clientReportId: draftId,
        pendingEvidence: pendingImages,
      });

      hasSubmittedRef.current = true;

      const evidenceStillPending =
        submissionResult.report.pendingEvidence &&
        submissionResult.report.pendingEvidence.length > 0;

      Alert.alert(
        "Report Submitted",
        !submissionResult.savedToBackend
          ? "Your report was saved on this device and will sync when the backend is available."
          : evidenceStillPending
            ? "Your report was saved. Your photos could not be uploaded yet and will keep trying in the background."
            : "Your report was submitted and saved to your account.",
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
            Submit product details so they can be reviewed securely.
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
              maxLength={160}
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
              maxLength={120}
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
              maxLength={120}
              placeholder="Example: Beverage, Cosmetic, Medicine"
              placeholderTextColor="#90A1B9"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reason for Report</Text>

          <View style={styles.reasonList}>
            {PRODUCT_REPORT_REASONS.map((reason) => {
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
            maxLength={2000}
            placeholder="Add any details about the product, label, store, or concern..."
            placeholderTextColor="#90A1B9"
            multiline
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photo Evidence (Optional)</Text>
          <Text style={styles.evidenceHelpText}>
            Add up to {MAX_EVIDENCE_IMAGES} photos of the product front, the
            barcode, the FDA registration claim on the label, ingredients, the
            expiry date, or anything about the packaging that looks
            suspicious.
          </Text>

          <View style={styles.evidenceGrid}>
            {pendingImages.map((image, index) => (
              <Pressable
                key={image.localUri}
                style={styles.evidenceThumbWrapper}
                disabled={isPickingPhoto}
                onPress={() => void handleReplaceImage(index)}
              >
                <Image
                  source={{ uri: image.localUri }}
                  style={styles.evidenceThumb}
                  contentFit="cover"
                />
                <Pressable
                  accessibilityLabel="Remove photo"
                  style={styles.evidenceRemoveButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
                <View style={styles.evidenceReplaceHint}>
                  <Text style={styles.evidenceReplaceHintText}>Tap to replace</Text>
                </View>
              </Pressable>
            ))}

            {pendingImages.length < MAX_EVIDENCE_IMAGES && (
              <View style={styles.evidenceAddRow}>
                <Pressable
                  style={styles.evidenceAddButton}
                  disabled={isPickingPhoto}
                  onPress={() => void handleAddFromLibrary()}
                >
                  {isPickingPhoto ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <Ionicons name="images-outline" size={20} color="#4F46E5" />
                  )}
                  <Text style={styles.evidenceAddButtonText}>
                    Choose Photo
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.evidenceAddButton}
                  disabled={isPickingPhoto}
                  onPress={() => void handleAddFromCamera()}
                >
                  <Ionicons name="camera-outline" size={20} color="#4F46E5" />
                  <Text style={styles.evidenceAddButtonText}>Take Photo</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Text style={styles.evidenceCountText}>
            {pendingImages.length}/{MAX_EVIDENCE_IMAGES} photos added
          </Text>

          <View style={styles.privacyNotice}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#62748E" />
            <Text style={styles.privacyNoticeText}>
              Please don&apos;t include faces, IDs, receipts, addresses, or
              other personal information in your photos.
            </Text>
          </View>
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
            {isSubmitting ? "Submitting Report..." : "Submit Report"}
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

  evidenceHelpText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#62748E",
  },

  evidenceGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  evidenceThumbWrapper: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },

  evidenceThumb: {
    width: "100%",
    height: "100%",
  },

  evidenceRemoveButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(15,23,43,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  evidenceReplaceHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    backgroundColor: "rgba(15,23,43,0.65)",
    alignItems: "center",
  },

  evidenceReplaceHintText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  evidenceAddRow: {
    flexDirection: "row",
    gap: 10,
  },

  evidenceAddButton: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  evidenceAddButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
    textAlign: "center",
  },

  evidenceCountText: {
    marginTop: 10,
    fontSize: 12,
    color: "#90A1B9",
  },

  privacyNotice: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  privacyNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#62748E",
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
