import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Card from "@/components/common/Card";
import {
  formatAdvisoryDate,
  getAdvisoryAppearance,
} from "@/components/advisories/advisory-appearance";
import { fetchFdaAdvisories } from "@/services/fda-advisories";
import type { FdaAdvisory } from "@/types/fda-advisory";

export default function FdaAdvisoriesCard() {
  const router = useRouter();
  const [advisories, setAdvisories] = useState<FdaAdvisory[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();

    const loadLatestAdvisories = async () => {
      try {
        const result = await fetchFdaAdvisories(
          {
            page: 1,
            limit: 2,
          },
          controller.signal,
        );

        if (isMountedRef.current) {
          setAdvisories(result.advisories);
          setTotal(result.pagination.total);
        }
      } catch (error) {
        if (isMountedRef.current && !(error instanceof Error && error.name === "AbortError")) {
          console.log("Failed to load latest FDA advisories:", error);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadLatestAdvisories();

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, []);

  const viewAll = () => {
    router.push("/fda-advisories" as never);
  };

  const openAdvisory = (advisoryNumber: string) => {
    router.push({
      pathname: "/fda-advisories/[advisoryNumber]",
      params: {
        advisoryNumber,
      },
    } as never);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headingGroup}>
          <View style={styles.iconBox}>
            <Ionicons name="newspaper-outline" size={17} color="#4F46E5" />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.title}>FDA Advisories</Text>
            <Text style={styles.subtitle}>Food, drugs, and cosmetics</Text>
          </View>
        </View>

        <Pressable style={styles.viewAllButton} onPress={viewAll}>
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={15} color="#4F46E5" />
        </Pressable>
      </View>

      <View style={styles.searchHint}>
        <Ionicons name="search-outline" size={17} color="#4F46E5" />
        <Text style={styles.searchHintText}>
          No barcode? Search by product name or advisory number.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading latest notices...</Text>
        </View>
      ) : advisories.length > 0 ? (
        <View style={styles.advisoryList}>
          {advisories.map((advisory) => {
            const appearance = getAdvisoryAppearance(advisory.status);

            return (
              <Pressable
                key={advisory.advisoryNumber}
                style={({ pressed }) => [
                  styles.advisoryRow,
                  pressed && styles.pressed,
                ]}
                onPress={() => openAdvisory(advisory.advisoryNumber)}
              >
                <View
                  style={[
                    styles.statusIcon,
                    { backgroundColor: appearance.background },
                  ]}
                >
                  <Ionicons
                    name={appearance.icon}
                    size={17}
                    color={appearance.color}
                  />
                </View>

                <View style={styles.advisoryText}>
                  <Text style={styles.advisoryMeta}>
                    {advisory.advisoryNumber} · {advisory.categoryLabel} ·{" "}
                    {formatAdvisoryDate(advisory.publishedAt)}
                  </Text>
                  <Text numberOfLines={2} style={styles.advisoryTitle}>
                    {advisory.title}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Pressable style={styles.fallbackButton} onPress={viewAll}>
          <Text style={styles.fallbackText}>Open the advisory search</Text>
        </Pressable>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Updated through Aug 7, 2026</Text>
        {total !== null && (
          <Text style={styles.totalText}>{total} notices</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 17,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headingGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headingText: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    color: "#1D293D",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 1,
    color: "#90A1B9",
    fontSize: 11,
    lineHeight: 16,
  },
  viewAllButton: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    color: "#4F46E5",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  searchHint: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchHintText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
  },
  loadingRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 12,
  },
  advisoryList: {
    marginTop: 6,
  },
  advisoryRow: {
    minHeight: 72,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.72,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  advisoryText: {
    flex: 1,
    marginHorizontal: 10,
  },
  advisoryMeta: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  advisoryTitle: {
    marginTop: 3,
    color: "#1D293D",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  fallbackButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  footerRow: {
    paddingTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 14,
  },
  totalText: {
    color: "#4F46E5",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
});
