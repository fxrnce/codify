import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const REPORTS_STORAGE_KEY = "codify_product_reports";

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

function formatReportTime(dateValue: string) {
  const date = new Date(dateValue);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReportedProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const openedAfterReport = params.from === "report-submitted";
  const [reports, setReports] = useState<ProductReport[]>([]);

  const loadReports = async () => {
    try {
      const savedReports = await AsyncStorage.getItem(REPORTS_STORAGE_KEY);
      const parsedReports: ProductReport[] = savedReports
        ? JSON.parse(savedReports)
        : [];

      setReports(parsedReports);
    } catch (error) {
      console.log("Failed to load reports:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, []),
  );

  const goBack = () => {
    if (openedAfterReport) {
      router.replace("/scanner" as never);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/scanner" as never);
  };
  const openProductResult = (report: ProductReport) => {
    const cleanedBarcode = report.barcode.trim();

    if (!cleanedBarcode || cleanedBarcode === "No barcode") {
      Alert.alert(
        "No Barcode",
        "This report does not have a barcode to verify.",
      );
      return;
    }

    router.push({
      pathname: "/product-result/[barcode]",
      params: {
        barcode: cleanedBarcode,
        from: "reports",
      },
    });
  };

  const clearReports = () => {
    Alert.alert(
      "Clear Reports",
      "Are you sure you want to remove all saved product reports?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(REPORTS_STORAGE_KEY);
              setReports([]);
            } catch (error) {
              console.log("Failed to clear reports:", error);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
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

          {reports.length > 0 && (
            <Pressable style={styles.clearButton} onPress={clearReports}>
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>PRODUCT REPORTS</Text>
          <Text style={styles.headerTitle}>Reported Products</Text>
          <Text style={styles.headerSubtitle}>
            {reports.length === 1
              ? "1 saved report"
              : `${reports.length} saved reports`}
          </Text>
        </View>
      </LinearGradient>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="flag-outline" size={46} color="#CBD5E1" />
          </View>

          <Text style={styles.emptyTitle}>No reports yet</Text>

          <Text style={styles.emptyText}>
            Product reports will appear here after you submit a report from a
            product result page.
          </Text>

          <Pressable
            style={styles.scanButton}
            onPress={() => router.replace("/scanner" as never)}
          >
            <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan a Product</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {reports.map((report) => (
            <Pressable
              key={report.id}
              style={({ pressed }) => [
                styles.reportCard,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => openProductResult(report)}
            >
              <View style={styles.reportTopRow}>
                <View style={styles.reportIconBox}>
                  <Ionicons name="flag-outline" size={20} color="#E7000B" />
                </View>

                <View style={styles.reportInfo}>
                  <Text numberOfLines={1} style={styles.productName}>
                    {report.productName}
                  </Text>

                  <Text numberOfLines={1} style={styles.productMeta}>
                    {report.brand} • {report.category}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </View>

              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Barcode</Text>
                  <Text numberOfLines={1} style={styles.infoValue}>
                    {report.barcode}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reason</Text>
                  <Text numberOfLines={1} style={styles.infoDanger}>
                    {report.reason}
                  </Text>
                </View>

                <View style={styles.infoRowLast}>
                  <Text style={styles.infoLabel}>Submitted</Text>
                  <Text style={styles.infoValue}>
                    {formatReportTime(report.submittedAt)}
                  </Text>
                </View>
              </View>

              {report.notes.length > 0 && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{report.notes}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    height: 230,
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

  clearButton: {
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
    gap: 14,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  emptyIconBox: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 24,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "900",
    color: "#1D293D",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#90A1B9",
    textAlign: "center",
  },

  scanButton: {
    marginTop: 24,
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: "#4F39F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  scanButtonText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  reportCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.8)",
    padding: 16,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  reportTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  reportIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  reportInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  productName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: "#1D293D",
  },

  productMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#62748E",
  },

  infoBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
  },

  infoRow: {
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoRowLast: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: "#62748E",
  },

  infoValue: {
    maxWidth: "58%",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#1D293D",
    textAlign: "right",
  },

  infoDanger: {
    maxWidth: "58%",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#E7000B",
    textAlign: "right",
  },

  notesBox: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    padding: 12,
  },

  notesLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#E7000B",
  },

  notesText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: "#45556C",
  },
});
