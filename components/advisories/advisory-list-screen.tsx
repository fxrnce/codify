import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  formatAdvisoryDate,
  getAdvisoryAppearance,
} from "@/components/advisories/advisory-appearance";
import { fetchFdaAdvisories } from "@/services/fda-advisories";
import type {
  FdaAdvisory,
  FdaAdvisoryCategory,
  FdaAdvisoryStatus,
} from "@/types/fda-advisory";

type CategoryFilter = FdaAdvisoryCategory | "ALL";
type StatusFilter = FdaAdvisoryStatus | "ALL";

const categoryFilters: { label: string; value: CategoryFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Food", value: "FOOD" },
  { label: "Drugs", value: "DRUG" },
  { label: "Cosmetics", value: "COSMETIC" },
];

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All notices", value: "ALL" },
  { label: "Not Approved", value: "NOT_APPROVED" },
  { label: "Caution", value: "CAUTION" },
  { label: "Lifted", value: "LIFTED" },
];

export default function AdvisoryListScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [advisories, setAdvisories] = useState<FdaAdvisory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [updatedThrough, setUpdatedThrough] = useState("2026-08-07");
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchText.trim());
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchText]);

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
        const result = await fetchFdaAdvisories({
          query: debouncedQuery || undefined,
          category: category === "ALL" ? undefined : category,
          status: status === "ALL" ? undefined : status,
          page: nextPage,
          limit: 20,
        });

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setAdvisories((current) =>
          reset ? result.advisories : [...current, ...result.advisories],
        );
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
        setUpdatedThrough(result.updatedThrough);
      } catch (error) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load FDA advisories.";
        setErrorMessage(message);

        if (reset) {
          setAdvisories([]);
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
    [category, debouncedQuery, status],
  );

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

  const loadMore = () => {
    if (!isLoading && !isLoadingMore && page < totalPages) {
      void loadPage(page + 1, false);
    }
  };

  const openAdvisory = (advisoryNumber: string) => {
    router.push({
      pathname: "/fda-advisories/[advisoryNumber]",
      params: {
        advisoryNumber,
      },
    } as never);
  };

  const renderAdvisory = ({ item }: { item: FdaAdvisory }) => {
    const appearance = getAdvisoryAppearance(item.status);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.advisoryCard,
          pressed && styles.pressed,
        ]}
        onPress={() => openAdvisory(item.advisoryNumber)}
      >
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: appearance.background,
                borderColor: appearance.border,
              },
            ]}
          >
            <Ionicons
              name={appearance.icon}
              size={14}
              color={appearance.color}
            />
            <Text style={[styles.statusBadgeText, { color: appearance.color }]}>
              {item.statusLabel}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {formatAdvisoryDate(item.publishedAt)}
          </Text>
        </View>

        <Text style={styles.advisoryNumber}>FDA Advisory {item.advisoryNumber}</Text>
        <Text numberOfLines={3} style={styles.advisoryTitle}>
          {item.title}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{item.categoryLabel}</Text>
          </View>
          <Text style={styles.typeText}>{item.typeLabel}</Text>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#90A1B9" />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search product or advisory number"
          placeholderTextColor="#90A1B9"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={20} color="#90A1B9" />
          </Pressable>
        )}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#4F46E5" />
        <Text style={styles.infoText}>
          Most advisory products have no scannable retail barcode. Search the
          product name or FDA advisory number instead.
        </Text>
      </View>

      <Text style={styles.filterLabel}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {categoryFilters.map((filter) => {
          const selected = category === filter.value;

          return (
            <Pressable
              key={filter.value}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setCategory(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selected && styles.filterChipTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.filterLabel}>Status</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {statusFilters.map((filter) => {
          const selected = status === filter.value;

          return (
            <Pressable
              key={filter.value}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setStatus(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selected && styles.filterChipTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>Advisory Results</Text>
        <Text style={styles.resultCount}>{total} found</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#4338CA", "#5B4CF6", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerCircle} />

        <View style={styles.topRow}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerButton}>
            <Ionicons name="newspaper-outline" size={20} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.headerLabel}>PHILIPPINE FDA DATABASE</Text>
        <Text style={styles.headerTitle}>FDA Advisories</Text>
        <Text style={styles.headerSubtitle}>
          Product warnings, recalls, safety notices, and lifted advisories.
        </Text>
      </LinearGradient>

      <FlatList
        data={advisories}
        keyExtractor={(item) => item.advisoryNumber}
        renderItem={renderAdvisory}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.stateText}>Loading FDA advisories...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateContainer}>
              <Ionicons name="cloud-offline-outline" size={40} color="#CBD5E1" />
              <Text style={styles.stateTitle}>Could not load advisories</Text>
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
              <Ionicons name="search-outline" size={40} color="#CBD5E1" />
              <Text style={styles.stateTitle}>No advisory found</Text>
              <Text style={styles.stateText}>
                Try another product name, advisory number, category, or status.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            {isLoadingMore && (
              <ActivityIndicator size="small" color="#4F46E5" />
            )}
            <Text style={styles.updatedText}>
              Source index updated through {formatAdvisoryDate(updatedThrough)}
            </Text>
          </View>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    height: 232,
    paddingTop: 48,
    paddingHorizontal: 20,
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
  headerLabel: {
    marginTop: 25,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  headerTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  headerSubtitle: {
    marginTop: 6,
    maxWidth: 320,
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: { padding: 16, paddingBottom: 32 },
  searchContainer: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 0,
    color: "#1D293D",
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: "#4F46E5",
    fontSize: 12,
    lineHeight: 18,
  },
  filterLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: "#475569",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  filterRow: { gap: 8, paddingRight: 6 },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipSelected: { borderColor: "#4F46E5", backgroundColor: "#4F46E5" },
  filterChipText: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  filterChipTextSelected: { color: "#FFFFFF" },
  resultHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultTitle: { color: "#1D293D", fontSize: 18, fontWeight: "900" },
  resultCount: { color: "#90A1B9", fontSize: 13, fontWeight: "700" },
  advisoryCard: {
    minHeight: 168,
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
  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "800" },
  dateText: { color: "#94A3B8", fontSize: 11, fontWeight: "700" },
  advisoryNumber: {
    marginTop: 13,
    color: "#4F46E5",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  advisoryTitle: {
    marginTop: 5,
    color: "#1D293D",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  metaPillText: { color: "#475569", fontSize: 10, fontWeight: "800" },
  typeText: { flex: 1, color: "#64748B", fontSize: 11, fontWeight: "600" },
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
  listFooter: { minHeight: 70, alignItems: "center", justifyContent: "center", gap: 9 },
  updatedText: { color: "#94A3B8", fontSize: 10, textAlign: "center" },
});
