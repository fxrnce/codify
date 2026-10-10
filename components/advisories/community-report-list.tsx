import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatCommunityReportDate,
  getCommunityReasonAppearance,
} from "@/components/advisories/community-report-appearance";
import { useNetworkStatus } from "@/contexts/NetworkContext";
import { fetchCommunityReports } from "@/services/community-reports";
import type { CommunityReport } from "@/types/community-report";

export default function CommunityReportList({
  barcode,
  onClearBarcode,
}: {
  barcode?: string;
  onClearBarcode: () => void;
}) {
  const router = useRouter();
  const { isBackendReachable } = useNetworkStatus();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (nextPage: number, reset: boolean) => {
      const requestId = ++requestIdRef.current;

      if (reset) {
        setIsLoading(true);
        setErrorMessage(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        if (!isBackendReachable) {
          throw new Error(
            "Community reports need an internet connection. Connect and try again.",
          );
        }

        const result = await fetchCommunityReports({
          barcode,
          page: nextPage,
          limit: 20,
        });

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setReports((current) =>
          reset ? result.reports : [...current, ...result.reports],
        );
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
      } catch (error) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load community reports.",
        );

        if (reset) {
          setReports([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (isMountedRef.current && requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [barcode, isBackendReachable],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadPage(1, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadPage]);

  const loadMore = () => {
    if (!isLoading && !isLoadingMore && page < totalPages) {
      void loadPage(page + 1, false);
    }
  };

  const openReport = (id: string) => {
    router.push({
      pathname: "/fda-advisories/community/[id]",
      params: { id },
    } as never);
  };

  const renderReport = ({ item }: { item: CommunityReport }) => {
    const appearance = getCommunityReasonAppearance(item.reason);

    return (
      <Pressable
        style={({ pressed }) => [styles.reportCard, pressed && styles.pressed]}
        onPress={() => openReport(item.id)}
      >
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
            <Ionicons name={appearance.icon} size={13} color={appearance.color} />
            <Text style={[styles.reasonBadgeText, { color: appearance.color }]}>
              {item.reason}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {formatCommunityReportDate(item.submittedAt)}
          </Text>
        </View>

        <Text numberOfLines={2} style={styles.productName}>
          {item.productName}
        </Text>
        {item.notes.length > 0 && (
          <Text numberOfLines={2} style={styles.notesText}>
            “{item.notes}”
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Ionicons name="shield-checkmark" size={15} color="#047857" />
          <Text style={styles.reviewedText}>Reviewed by Codify</Text>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.disclaimerCard}>
        <Ionicons name="alert-circle-outline" size={18} color="#C2410C" />
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerStrong}>Not FDA advisories. </Text>
          These reports come from Codify users and were reviewed by our team.
          Reporter names are never shown.
        </Text>
      </View>

      {barcode ? (
        <View style={styles.filterPill}>
          <Ionicons name="barcode-outline" size={16} color="#4F46E5" />
          <Text numberOfLines={1} style={styles.filterPillText}>
            Reports for {barcode}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={onClearBarcode}
            accessibilityRole="button"
            accessibilityLabel="Show all community reports"
          >
            <Text style={styles.filterPillAction}>Show all</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Reviewed Reports</Text>
        <Text style={styles.resultCount}>{total} found</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      renderItem={renderReport}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.stateText}>Loading community reports...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateContainer}>
            <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E1" />
            <Text style={styles.stateTitle}>Could not load reports</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void loadPage(1, true)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.stateContainer}>
            <Ionicons name="people-outline" size={40} color="#CBD5E1" />
            <Text style={styles.stateTitle}>No reviewed reports yet</Text>
            <Text style={styles.stateText}>
              {barcode
                ? "No community reports for this product have been reviewed and published."
                : "Reports appear here after the Codify team reviews and publishes them."}
            </Text>
          </View>
        )
      }
      ListFooterComponent={
        <View style={styles.listFooter}>
          {isLoadingMore && <ActivityIndicator size="small" color="#4F46E5" />}
        </View>
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 32 },
  disclaimerCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    color: "#9A3412",
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerStrong: { fontWeight: "800" },
  filterPill: {
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPillText: {
    flex: 1,
    color: "#1D293D",
    fontSize: 13,
    fontWeight: "700",
  },
  filterPillAction: { color: "#4F46E5", fontSize: 13, fontWeight: "800" },
  resultHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultTitle: { color: "#1D293D", fontSize: 18, fontWeight: "900" },
  resultCount: { color: "#90A1B9", fontSize: 13, fontWeight: "700" },
  reportCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.85)",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: { opacity: 0.78 },
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
  dateText: { color: "#94A3B8", fontSize: 11, fontWeight: "700" },
  productName: {
    marginTop: 12,
    color: "#1D293D",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  notesText: {
    marginTop: 4,
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewedText: {
    flex: 1,
    color: "#047857",
    fontSize: 11,
    fontWeight: "800",
  },
  separator: { height: 12 },
  stateContainer: {
    minHeight: 260,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    marginTop: 12,
    color: "#1D293D",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  stateText: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  listFooter: { minHeight: 40, alignItems: "center", justifyContent: "center" },
});
