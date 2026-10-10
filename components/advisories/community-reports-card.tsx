import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatCommunityReportDate } from "@/components/advisories/community-report-appearance";
import { useNetworkStatus } from "@/contexts/NetworkContext";
import { fetchCommunityReports } from "@/services/community-reports";
import type { CommunityReport } from "@/types/community-report";

// Product-page summary of published community reports for one barcode.
// Renders nothing while loading, offline, on error, or when there are none,
// so product pages without reports look exactly as before.
export default function CommunityReportsCard({ barcode }: { barcode: string }) {
  const router = useRouter();
  const { isBackendReachable } = useNetworkStatus();
  // Keyed by barcode so a summary from a previous product is never shown.
  const [summary, setSummary] = useState<{
    barcode: string;
    total: number;
    latest: CommunityReport;
  } | null>(null);

  useEffect(() => {
    if (!barcode || !isBackendReachable) {
      return;
    }

    const controller = new AbortController();

    fetchCommunityReports({ barcode, limit: 1 }, controller.signal)
      .then((result) => {
        const latest = result.reports[0];
        if (!controller.signal.aborted) {
          setSummary(
            latest ? { barcode, total: result.pagination.total, latest } : null,
          );
        }
      })
      .catch(() => {
        // Optional enrichment; the product page is complete without it.
      });

    return () => {
      controller.abort();
    };
  }, [barcode, isBackendReachable]);

  if (!summary || summary.barcode !== barcode || !isBackendReachable) {
    return null;
  }

  const { total, latest } = summary;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/fda-advisories",
          params: { tab: "community", barcode },
        } as never)
      }
    >
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons name="people-outline" size={20} color="#4F46E5" />
        </View>
        <View style={styles.textBox}>
          <Text style={styles.title}>
            {total} community {total === 1 ? "report" : "reports"} (reviewed)
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            Latest: {latest.reason} ·{" "}
            {formatCommunityReportDate(latest.reviewedAt ?? latest.submittedAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
      <Text style={styles.footer}>
        From Codify users, reviewed by our team. Not an FDA advisory.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: { opacity: 0.78 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: { flex: 1 },
  title: { color: "#1D293D", fontSize: 14, fontWeight: "800" },
  subtitle: { marginTop: 2, color: "#475569", fontSize: 12 },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
  },
});
