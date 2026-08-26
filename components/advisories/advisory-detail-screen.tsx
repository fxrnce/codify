import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatAdvisoryDate,
  getAdvisoryAppearance,
} from "@/components/advisories/advisory-appearance";
import { fetchFdaAdvisory } from "@/services/fda-advisories";
import type { FdaAdvisory } from "@/types/fda-advisory";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getSafetyCopy(advisory: FdaAdvisory) {
  if (advisory.status === "LIFTED") {
    return {
      title: "Advisory Lifted",
      message:
        "The FDA issued this lifting notice. Read the official source for the exact product scope and conditions.",
    };
  }

  if (advisory.status === "CAUTION") {
    return {
      title: advisory.typeLabel,
      message:
        "This registered or previously marketed product is covered by a recall, quality hold, or safety notice. Follow the official FDA instructions before using it.",
    };
  }

  return {
    title: "Do Not Purchase or Use",
    message:
      "The Philippine FDA identifies the product in this notice as unregistered, unauthorized, counterfeit, or otherwise non-compliant. Avoid purchasing or using the exact product named in the advisory.",
  };
}

export default function AdvisoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    advisoryNumber?: string | string[];
  }>();
  const advisoryNumber = Array.isArray(params.advisoryNumber)
    ? params.advisoryNumber[0]
    : params.advisoryNumber;
  const [advisory, setAdvisory] = useState<FdaAdvisory | null>(null);
  const [updatedThrough, setUpdatedThrough] = useState("2026-08-07");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAdvisory = async (signal?: AbortSignal) => {
    if (!advisoryNumber) {
      setErrorMessage("FDA advisory number is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchFdaAdvisory(advisoryNumber, signal);
      setAdvisory(result.advisory);
      setUpdatedThrough(result.updatedThrough);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load this FDA advisory.",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadAdvisory(controller.signal);

    return () => {
      controller.abort();
    };
    // The route parameter is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisoryNumber]);

  const appearance = useMemo(
    () => getAdvisoryAppearance(advisory?.status ?? "NOT_APPROVED"),
    [advisory?.status],
  );

  const openOfficialSource = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.log("Failed to open FDA advisory source:", error);
      Alert.alert(
        "Unable to open FDA page",
        "The official FDA website could not be opened. Please try again later.",
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading official advisory...</Text>
      </View>
    );
  }

  if (!advisory || errorMessage) {
    return (
      <View style={styles.errorScreen}>
        <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1D293D" />
        </Pressable>
        <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Advisory unavailable</Text>
        <Text style={styles.errorText}>
          {errorMessage ?? "The requested FDA advisory could not be found."}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => void loadAdvisory()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const safetyCopy = getSafetyCopy(advisory);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={[...appearance.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.largeCircle} />
          <View style={styles.smallCircle} />

          <View style={styles.topRow}>
            <Pressable style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerButton}>
              <Ionicons name={appearance.icon} size={20} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.headerStatusRow}>
            <Ionicons name={appearance.icon} size={17} color="#FFFFFF" />
            <Text style={styles.headerStatus}>{advisory.statusLabel}</Text>
          </View>
          <Text style={styles.headerNumber}>
            FDA Advisory No. {advisory.advisoryNumber}
          </Text>
          <Text style={styles.headerTitle}>{advisory.title}</Text>
          <View style={styles.headerMetaRow}>
            <Text style={styles.headerMeta}>{advisory.categoryLabel}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.headerMeta}>
              {formatAdvisoryDate(advisory.publishedAt)}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View
            style={[
              styles.safetyCard,
              {
                backgroundColor: appearance.background,
                borderColor: appearance.border,
              },
            ]}
          >
            <View
              style={[
                styles.safetyIcon,
                { backgroundColor: `${appearance.color}18` },
              ]}
            >
              <Ionicons
                name={appearance.icon}
                size={22}
                color={appearance.color}
              />
            </View>
            <View style={styles.safetyTextGroup}>
              <Text style={[styles.safetyTitle, { color: appearance.color }]}>
                {safetyCopy.title}
              </Text>
              <Text style={[styles.safetyMessage, { color: appearance.color }]}>
                {safetyCopy.message}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeadingRow}>
              <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
              <Text style={styles.cardTitle}>Advisory Information</Text>
            </View>
            <DetailRow label="Advisory No." value={advisory.advisoryNumber} />
            <DetailRow label="Category" value={advisory.categoryLabel} />
            <DetailRow label="Notice Type" value={advisory.typeLabel} />
            <DetailRow
              label="Published"
              value={formatAdvisoryDate(advisory.publishedAt)}
            />
            <DetailRow label="Current Status" value={advisory.statusLabel} />
          </View>

          <View style={styles.noBarcodeCard}>
            <View style={styles.noBarcodeIcon}>
              <Ionicons name="search-outline" size={21} color="#4F46E5" />
            </View>
            <View style={styles.noBarcodeTextGroup}>
              <Text style={styles.noBarcodeTitle}>No barcode required</Text>
              <Text style={styles.noBarcodeText}>
                FDA advisories may identify a product without publishing its
                retail barcode. This entry is matched by product name and
                advisory number.
              </Text>
            </View>
          </View>

          <View style={styles.sourceCard}>
            <View style={styles.cardHeadingRow}>
              <Ionicons name="link-outline" size={20} color="#4F46E5" />
              <Text style={styles.cardTitle}>Official FDA Sources</Text>
            </View>
            <Text style={styles.sourceDescription}>
              Open the official Philippine FDA page for the complete notice,
              product images, and instructions.
            </Text>

            <Pressable
              style={styles.primarySourceButton}
              onPress={() => void openOfficialSource(advisory.sourceUrl)}
            >
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primarySourceText}>Open Official Advisory</Text>
            </Pressable>

            {advisory.filipinoSourceUrl && (
              <Pressable
                style={styles.secondarySourceButton}
                onPress={() =>
                  void openOfficialSource(advisory.filipinoSourceUrl!)
                }
              >
                <Ionicons name="language-outline" size={18} color="#4F46E5" />
                <Text style={styles.secondarySourceText}>
                  Open Filipino Advisory
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.disclaimerCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" />
            <Text style={styles.disclaimerText}>
              This is an FDA advisory index entry, not a product registration
              result. Always compare the exact product name and packaging with
              the official notice. Catalog updated through{" "}
              {formatAdvisoryDate(updatedThrough)}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 32 },
  header: {
    minHeight: 340,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: "hidden",
  },
  largeCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -35,
    top: -32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  smallCircle: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    left: -32,
    bottom: -18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerStatusRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  headerStatus: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  headerNumber: {
    marginTop: 13,
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  headerTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
  },
  headerMetaRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerMeta: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700" },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.55)" },
  content: { padding: 16, gap: 14 },
  safetyCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  safetyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTextGroup: { flex: 1 },
  safetyTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  safetyMessage: { marginTop: 5, fontSize: 12, lineHeight: 18 },
  card: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  cardHeadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  cardTitle: { color: "#1D293D", fontSize: 16, lineHeight: 22, fontWeight: "900" },
  detailRow: {
    minHeight: 48,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  detailLabel: { width: 92, color: "#64748B", fontSize: 12, lineHeight: 18 },
  detailValue: {
    flex: 1,
    color: "#1D293D",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  noBarcodeCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  noBarcodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  noBarcodeTextGroup: { flex: 1 },
  noBarcodeTitle: { color: "#3730A3", fontSize: 14, fontWeight: "900" },
  noBarcodeText: { marginTop: 5, color: "#4F46E5", fontSize: 12, lineHeight: 18 },
  sourceCard: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  sourceDescription: { color: "#64748B", fontSize: 12, lineHeight: 18 },
  primarySourceButton: {
    marginTop: 15,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primarySourceText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  secondarySourceButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondarySourceText: { color: "#4F46E5", fontSize: 13, fontWeight: "800" },
  disclaimerCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  disclaimerText: { flex: 1, color: "#64748B", fontSize: 11, lineHeight: 17 },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#64748B", fontSize: 13 },
  errorScreen: {
    flex: 1,
    paddingHorizontal: 28,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBackButton: {
    position: "absolute",
    top: 52,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { marginTop: 14, color: "#1D293D", fontSize: 19, fontWeight: "900" },
  errorText: { marginTop: 8, color: "#64748B", fontSize: 13, lineHeight: 19, textAlign: "center" },
  retryButton: {
    marginTop: 18,
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
