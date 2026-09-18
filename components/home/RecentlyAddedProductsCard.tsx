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
import type { DemoProduct, ProductStatus } from "@/constants/MockData";
import { useNetworkStatus } from "@/contexts/NetworkContext";
import { loadCachedProductCatalog } from "@/services/products";

const MAX_ITEMS = 5;

function getStatusAppearance(status: ProductStatus) {
  if (status === "Approved") {
    return {
      background: "#ECFDF5",
      color: "#009966",
      icon: "checkmark-circle" as const,
    };
  }

  if (status === "Caution") {
    return {
      background: "#FFFBEB",
      color: "#E17100",
      icon: "warning" as const,
    };
  }

  if (status === "Unverified") {
    return {
      background: "#F1F5F9",
      color: "#475569",
      icon: "help-circle" as const,
    };
  }

  return {
    background: "#FEF2F2",
    color: "#E7000B",
    icon: "close-circle" as const,
  };
}

function formatAddedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Products without a valid createdAt (e.g. older cached entries synced
// before this field existed) sort last rather than crashing or floating
// to the top.
function sortByRecentlyAdded(products: DemoProduct[]) {
  return [...products].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime();
    const secondTime = new Date(second.createdAt).getTime();

    return (
      (Number.isNaN(secondTime) ? -Infinity : secondTime) -
      (Number.isNaN(firstTime) ? -Infinity : firstTime)
    );
  });
}

export default function RecentlyAddedProductsCard() {
  const router = useRouter();
  // The app-wide sync in the root layout already keeps the local product
  // cache fresh (and is the only place that should call
  // refreshProductCatalog() / replace the cache — two components racing to
  // run competing SQLite write transactions causes "database is locked"
  // errors). This card only ever reads the cache, and re-reads whenever
  // that sync last completed.
  const { lastCatalogSyncAt } = useNetworkStatus();

  const [products, setProducts] = useState<DemoProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const loadRecentlyAdded = async () => {
      try {
        const cachedProducts = await loadCachedProductCatalog();

        if (isMountedRef.current) {
          setProducts(sortByRecentlyAdded(cachedProducts).slice(0, MAX_ITEMS));
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.log("Failed to load recently added products:", error);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadRecentlyAdded();

    return () => {
      isMountedRef.current = false;
    };
  }, [lastCatalogSyncAt]);

  const viewAll = () => {
    router.push("/search-product" as never);
  };

  const openProduct = (barcode: string) => {
    router.push({
      pathname: "/product-result/[barcode]",
      params: {
        barcode,
      },
    });
  };

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headingGroup}>
          <View style={styles.iconBox}>
            <Ionicons name="sparkles-outline" size={17} color="#4F46E5" />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.title}>Recently Added Products</Text>
            <Text style={styles.subtitle}>Newest items in the FDA catalog</Text>
          </View>
        </View>

        <Pressable style={styles.viewAllButton} onPress={viewAll}>
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={15} color="#4F46E5" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {products.map((product) => {
            const appearance = getStatusAppearance(product.status);

            return (
              <Pressable
                key={product.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => openProduct(product.barcode)}
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

                <View style={styles.rowText}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {product.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.rowMeta}>
                    {product.brand} · Added {formatAddedDate(product.createdAt)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
              </Pressable>
            );
          })}
        </View>
      )}
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
  list: {
    marginTop: 6,
  },
  row: {
    minHeight: 64,
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
  rowText: {
    flex: 1,
    marginHorizontal: 10,
  },
  rowTitle: {
    color: "#1D293D",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  rowMeta: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 15,
  },
});
