import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatCommunityReportDate,
  getCommunityReasonAppearance,
} from "@/components/advisories/community-report-appearance";
import { useNetworkStatus } from "@/contexts/NetworkContext";
import { fetchCommunityReport } from "@/services/community-reports";
import type { CommunityReport } from "@/types/community-report";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export default function CommunityReportDetailScreen() {
  const router = useRouter();
  const { isBackendReachable } = useNetworkStatus();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [report, setReport] = useState<CommunityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) {
        setErrorMessage("Community report id is missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (!isBackendReachable) {
          throw new Error(
            "Community reports need an internet connection. Connect and try again.",
          );
        }

        setReport(await fetchCommunityReport(id, signal));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load this community report.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [id, isBackendReachable],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      void loadReport(controller.signal);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadReport]);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading community report...</Text>
      </View>
    );
  }

  if (!report || errorMessage) {
    return (
      <View style={styles.errorScreen}>
        <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1D293D" />
        </Pressable>
        <Ionicons name="people-outline" size={48} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Report unavailable</Text>
        <Text style={styles.errorText}>
          {errorMessage ?? "This community report could not be found."}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => void loadReport()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const appearance = getCommunityReasonAppearance(report.reason);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={["#4338CA", "#5B4CF6", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerCircle} />
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerLabel}>COMMUNITY REPORT</Text>
          <Text style={styles.headerTitle} selectable>
            {report.productName}
          </Text>
          <Text style={styles.headerSubtitle} selectable>
            {report.brand}
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.reasonBadge,
                  {
                    backgroundColor: appearance.background,
                    borderColor: appearance.border,
                  },
                ]}
              >
                <Ionicons
                  name={appearance.icon}
                  size={13}
                  color={appearance.color}
                />
                <Text
                  style={[styles.reasonBadgeText, { color: appearance.color }]}
                >
                  {report.reason}
                </Text>
              </View>
              <Text style={styles.dateText}>
                Reported {formatCommunityReportDate(report.submittedAt)}
              </Text>
            </View>
            <View style={styles.detailGrid}>
              <DetailItem label="Category" value={report.category} />
              <DetailItem
                label="Barcode"
                value={report.barcode || "Not supplied"}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.userIcon}>
                <Ionicons name="person-outline" size={16} color="#475569" />
              </View>
              <Text style={styles.sectionTitle}>A ScanSuri user reported</Text>
            </View>
            <Text style={styles.sectionText} selectable>
              {report.notes
                ? `“${report.notes}”`
                : "No additional notes were included with this report."}
            </Text>
          </View>

          <View style={styles.responseCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.responseIcon}>
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.responseHeaderText}>
                <Text style={styles.responseTitle}>ScanSuri team response</Text>
                {report.reviewedAt && (
                  <Text style={styles.responseDate}>
                    Reviewed {formatCommunityReportDate(report.reviewedAt)}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.responseText} selectable>
              {report.response}
            </Text>
          </View>

          <View style={styles.disclaimerCard}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#475569"
            />
            <Text style={styles.disclaimerText}>
              This is a community report, not an official FDA advisory. Photos
              and reporter details stay private. Always check the FDA
              verification portal for official status.
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
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 26,
    overflow: "hidden",
  },
  headerCircle: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -25,
    top: -35,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    marginTop: 22,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  headerTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  headerSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
  body: { padding: 16, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reasonBadge: {
    flexShrink: 1,
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reasonBadgeText: { flexShrink: 1, fontSize: 11, fontWeight: "800" },
  dateText: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  detailGrid: { flexDirection: "row", gap: 10 },
  detailItem: { flex: 1 },
  detailLabel: { color: "#64748B", fontSize: 11, fontWeight: "800" },
  detailValue: {
    marginTop: 2,
    color: "#1D293D",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { color: "#1D293D", fontSize: 13, fontWeight: "800" },
  sectionText: { color: "#334155", fontSize: 13, lineHeight: 19 },
  responseCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: 10,
  },
  responseIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
  },
  responseHeaderText: { flex: 1 },
  responseTitle: { color: "#065F46", fontSize: 13, fontWeight: "800" },
  responseDate: { color: "#047857", fontSize: 11, fontWeight: "700" },
  responseText: { color: "#064E3B", fontSize: 13, lineHeight: 19 },
  disclaimerCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  disclaimerText: { flex: 1, color: "#475569", fontSize: 12, lineHeight: 17 },
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
