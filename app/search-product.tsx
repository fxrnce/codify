import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type DemoProduct,
  type ProductStatus,
  demoProducts,
} from "@/constants/MockData";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type SearchProduct = {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  status: ProductStatus;
  fdaStatusLabel: string;
  registrationNumber: string;
  ingredients: string[];
  allergens: string[];
};

type ProductCatalogResponse = {
  success?: boolean;
  message?: string;
  products?: SearchProduct[];
};

let productCatalogCache: SearchProduct[] | null = null;
let productCatalogRequest: Promise<SearchProduct[]> | null = null;

function mapDemoProduct(product: DemoProduct): SearchProduct {
  return {
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    category: product.category,
    status: product.status,
    fdaStatusLabel: product.fdaStatusLabel,
    registrationNumber: product.registrationNumber,
    ingredients: product.ingredients.map((ingredient) => ingredient.name),
    allergens: product.allergens,
  };
}

const localFallbackProducts = demoProducts.map(mapDemoProduct);

async function loadProductCatalog() {
  if (productCatalogCache) {
    return productCatalogCache;
  }

  if (productCatalogRequest) {
    return productCatalogRequest;
  }

  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing.");
  }

  productCatalogRequest = fetch(`${API_URL}/api/products`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })
    .then(async (response) => {
      const responseBody = (await response
        .json()
        .catch(() => ({}))) as ProductCatalogResponse;

      if (!response.ok) {
        throw new Error(
          responseBody.message ||
            `Unable to load products (${response.status}).`,
        );
      }

      const products = Array.isArray(responseBody.products)
        ? responseBody.products
        : [];

      productCatalogCache = products;

      return products;
    })
    .finally(() => {
      productCatalogRequest = null;
    });

  return productCatalogRequest;
}

function getStatusStyle(status: ProductStatus) {
  if (status === "Approved") {
    return {
      bg: "#ECFDF5",
      color: "#009966",
      icon: "checkmark-circle" as const,
      label: "Approved",
    };
  }

  if (status === "Caution") {
    return {
      bg: "#FFFBEB",
      color: "#E17100",
      icon: "warning" as const,
      label: "Caution",
    };
  }

  if (status === "Unverified") {
    return {
      bg: "#EEF2FF",
      color: "#4F46E5",
      icon: "help-circle" as const,
      label: "Unverified",
    };
  }

  return {
    bg: "#FEF2F2",
    color: "#E7000B",
    icon: "close-circle" as const,
    label: "FDA Advisory",
  };
}

export default function SearchProductScreen() {
  const router = useRouter();

  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>(
    productCatalogCache ?? localFallbackProducts,
  );

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const refreshProductCatalog = async () => {
      try {
        const backendProducts = await loadProductCatalog();

        if (isMounted && backendProducts.length > 0) {
          setProducts(backendProducts);
        }
      } catch (error) {
        /*
         * Search remains available through the local demo catalog when the
         * development backend is slow or temporarily unavailable.
         */
        console.log("Failed to refresh product catalog:", error);
      }
    };

    void refreshProductCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase();

    if (!normalizedSearchText) {
      return products;
    }

    return products.filter((product) => {
      const ingredientsText = product.ingredients.join(" ").toLowerCase();
      const allergensText = product.allergens.join(" ").toLowerCase();

      return (
        product.name.toLowerCase().includes(normalizedSearchText) ||
        product.brand.toLowerCase().includes(normalizedSearchText) ||
        product.category.toLowerCase().includes(normalizedSearchText) ||
        product.barcode.includes(normalizedSearchText) ||
        product.fdaStatusLabel.toLowerCase().includes(normalizedSearchText) ||
        product.registrationNumber
          .toLowerCase()
          .includes(normalizedSearchText) ||
        ingredientsText.includes(normalizedSearchText) ||
        allergensText.includes(normalizedSearchText)
      );
    });
  }, [products, searchText]);

  const canVerifyUnknownBarcode =
    filteredProducts.length === 0 && /^\d{8,14}$/.test(searchText.trim());

  const goBack = () => {
    router.back();
  };

  const openProductResult = (barcode: string) => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;

    try {
      router.push({
        pathname: "/product-result/[barcode]",
        params: {
          barcode,
          from: "search",
        },
      });
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 800);
    }
  };

  const verifyUnknownBarcode = () => {
    openProductResult(searchText.trim());
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#2563EB", "#4F46E5", "#7C3AED"]}
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

          <View style={styles.headerButton}>
            <Ionicons name="search-outline" size={20} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>PRODUCT DATABASE</Text>
          <Text style={styles.headerTitle}>Search Product</Text>
          <Text style={styles.headerSubtitle}>
            Search by product name, brand, barcode, category, or ingredient.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#90A1B9" />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search product, brand, barcode..."
            placeholderTextColor="#90A1B9"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#90A1B9" />
            </Pressable>
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#4F46E5"
          />

          <Text style={styles.infoText}>
            The Codify catalog loads once, then your searches are filtered
            instantly on this device.
          </Text>
        </View>

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Search Results</Text>

          <Text style={styles.resultCount}>
            {filteredProducts.length} found
          </Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="cube-outline" size={40} color="#CBD5E1" />
            </View>

            <Text style={styles.emptyTitle}>No product found</Text>

            <Text style={styles.emptyText}>
              Try another keyword, brand name, barcode, category, ingredient, or
              allergen.
            </Text>

            {canVerifyUnknownBarcode && (
              <Pressable
                style={styles.verifyUnknownButton}
                onPress={verifyUnknownBarcode}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.verifyUnknownText}>
                  Verify as Unknown Product
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => {
              const statusStyle = getStatusStyle(product.status);

              return (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    styles.productCard,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => openProductResult(product.barcode)}
                >
                  <View
                    style={[
                      styles.statusIconBox,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Ionicons
                      name={statusStyle.icon}
                      size={22}
                      color={statusStyle.color}
                    />
                  </View>

                  <View style={styles.productInfo}>
                    <Text numberOfLines={1} style={styles.productName}>
                      {product.name}
                    </Text>

                    <Text numberOfLines={1} style={styles.productMeta}>
                      {product.brand} • {product.category}
                    </Text>

                    <Text style={styles.barcodeText}>{product.barcode}</Text>
                  </View>

                  <View style={styles.rightSide}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#CBD5E1"
                      style={styles.forwardIcon}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
  },

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#1D293D",
    paddingVertical: 0,
  },

  infoCard: {
    marginTop: 14,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#4F46E5",
  },

  resultHeader: {
    marginTop: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "900",
    color: "#1D293D",
  },

  resultCount: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#90A1B9",
  },

  productList: {
    gap: 12,
  },

  productCard: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(241,245,249,0.8)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },

  statusIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  productName: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    color: "#1D293D",
  },

  productMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#62748E",
  },

  barcodeText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  rightSide: {
    alignItems: "flex-end",
  },

  statusPill: {
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  forwardIcon: {
    marginTop: 12,
  },

  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 22,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "900",
    color: "#1D293D",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#90A1B9",
    textAlign: "center",
  },

  verifyUnknownButton: {
    marginTop: 22,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E7000B",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  verifyUnknownText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
