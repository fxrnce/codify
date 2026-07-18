import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from "react-native";

import { DemoProduct, ProductStatus } from "@/constants/MockData";
import { useAllergenAlerts } from "@/contexts/AllergenContext";
import { useScanHistory } from "@/contexts/ScanHistoryContext";

type ProductLoadState = "loading" | "success" | "not-found" | "error";

type ProductApiResponse = {
  success?: boolean;
  message?: string;
  product?: DemoProduct;
};

function getStatusColors(status: ProductStatus) {
  if (status === "Approved") {
    return {
      gradient: ["#00BC7D", "#00BBA7"] as const,
      icon: "checkmark-circle-outline" as const,
      scoreColor: "#F0B100",
    };
  }

  if (status === "Caution") {
    return {
      gradient: ["#FE9A00", "#F59E0B"] as const,
      icon: "warning-outline" as const,
      scoreColor: "#FE9A00",
    };
  }

  if (status === "Unverified") {
    return {
      gradient: ["#475569", "#64748B"] as const,
      icon: "help-circle-outline" as const,
      scoreColor: "#64748B",
    };
  }

  return {
    gradient: ["#FB2C36", "#E7000B"] as const,
    icon: "close-circle-outline" as const,
    scoreColor: "#E7000B",
  };
}

function getStatusNoticeColors(status: ProductStatus) {
  if (status === "Approved") {
    return {
      background: "#ECFDF5",
      border: "#D0FAE5",
      iconBackground: "#D0FAE5",
      title: "#007A55",
      text: "#009966",
      icon: "#00A878",
    };
  }

  if (status === "Caution") {
    return {
      background: "#FFFBEB",
      border: "#FEF3C6",
      iconBackground: "#FEF3C6",
      title: "#BB4D00",
      text: "#C65D00",
      icon: "#E17100",
    };
  }

  if (status === "FDA Advisory") {
    return {
      background: "#FEF2F2",
      border: "#FFE2E2",
      iconBackground: "#FFE2E2",
      title: "#C10007",
      text: "#E7000B",
      icon: "#E7000B",
    };
  }

  return {
    background: "#F8FAFC",
    border: "#CBD5E1",
    iconBackground: "#E2E8F0",
    title: "#334155",
    text: "#475569",
    icon: "#475569",
  };
}

function getHeaderStatusLabel(status: ProductStatus) {
  if (status === "Unverified") {
    return "Not Verified";
  }

  if (status === "FDA Advisory") {
    return "Not Approved";
  }

  return status;
}

function getAdvisoryImageSource(product: DemoProduct) {
  if (product.status === "FDA Advisory" && product.imageUrl) {
    return {
      uri: product.imageUrl,
    };
  }

  return null;
}

function getScoreWidth(score: number): DimensionValue {
  if (score <= 0) {
    return "0%";
  }

  if (score >= 100) {
    return "100%";
  }

  return `${score}%` as DimensionValue;
}

function normalizeAllergen(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ProductResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode: string; from?: string }>();

  const { selectedAllergens } = useAllergenAlerts();
  const { addScanToHistory, addUnknownScanToHistory } = useScanHistory();

  const isNavigatingRef = useRef(false);
  const recordedBarcodeRef = useRef<string | null>(null);

  const [product, setProduct] = useState<DemoProduct | null>(null);
  const [productLoadState, setProductLoadState] =
    useState<ProductLoadState>("loading");
  const [productLoadError, setProductLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const barcode = params.barcode ?? "";
  const openedFromHistory = params.from === "history";
  const openedFromSearch = params.from === "search";
  const openedFromReports = params.from === "reports";

  const navigateWithLock = (navigationAction: () => void) => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;

    try {
      navigationAction();
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 800);
    }
  };

  const goBackFromResult = () => {
    navigateWithLock(() => {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      if (openedFromHistory) {
        router.replace("/history" as never);
        return;
      }

      if (openedFromSearch) {
        router.replace("/search-product" as never);
        return;
      }

      if (openedFromReports) {
        router.replace("/reported-products" as never);
        return;
      }

      router.replace("/scanner" as never);
    });
  };

  const goToHistory = () => {
    navigateWithLock(() => {
      router.replace("/history" as never);
    });
  };

  const goToScanner = () => {
    navigateWithLock(() => {
      router.replace("/scanner" as never);
    });
  };

  const handleReportProduct = () => {
    navigateWithLock(() => {
      router.push({
        pathname: "/report-product",
        params: {
          barcode,
        },
      });
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      setProduct(null);
      setProductLoadState("loading");
      setProductLoadError("");

      if (!barcode) {
        setProductLoadState("not-found");
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

      if (!apiUrl) {
        setProductLoadError(
          "EXPO_PUBLIC_API_URL is missing from the Expo .env file.",
        );
        setProductLoadState("error");
        return;
      }

      try {
        const response = await fetch(
          `${apiUrl}/api/products/${encodeURIComponent(barcode)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        const responseBody = (await response
          .json()
          .catch(() => ({}))) as ProductApiResponse;

        if (response.status === 404) {
          setProductLoadState("not-found");
          return;
        }

        if (!response.ok) {
          throw new Error(
            responseBody.message ||
              `Product request failed with status ${response.status}.`,
          );
        }

        if (!responseBody.product) {
          throw new Error("The backend returned an invalid product response.");
        }

        setProduct(responseBody.product);
        setProductLoadState("success");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to connect to the Codify backend.";

        console.log("Failed to load product from backend:", error);

        setProductLoadError(message);
        setProductLoadState("error");
      }
    };

    void loadProduct();

    return () => {
      controller.abort();
    };
  }, [barcode, reloadKey]);

  useEffect(() => {
    if (
      openedFromHistory ||
      !barcode ||
      recordedBarcodeRef.current === barcode
    ) {
      return;
    }

    if (productLoadState === "success" && product) {
      addScanToHistory(product);
      recordedBarcodeRef.current = barcode;
      return;
    }

    if (productLoadState === "not-found") {
      addUnknownScanToHistory(barcode);
      recordedBarcodeRef.current = barcode;
    }
  }, [
    barcode,
    product,
    productLoadState,
    openedFromHistory,
    addScanToHistory,
    addUnknownScanToHistory,
  ]);

  const handleShare = async () => {
    if (!product) {
      return;
    }

    await Share.share({
      message: `${product.name}\nStatus: ${product.fdaStatusLabel}\nBarcode: ${product.barcode}`,
    });
  };

  if (productLoadState === "loading") {
    return (
      <View style={styles.notFoundScreen}>
        <ActivityIndicator size="large" color="#4F39F6" />
        <Text style={styles.notFoundTitle}>Loading Product</Text>
        <Text style={styles.notFoundText}>
          Checking the Codify product database...
        </Text>
      </View>
    );
  }

  if (productLoadState === "error") {
    return (
      <View style={styles.notFoundScreen}>
        <Ionicons name="cloud-offline-outline" size={54} color="#E7000B" />

        <Text style={styles.notFoundTitle}>Unable to Load Product</Text>

        <Text style={styles.notFoundText}>
          {productLoadError ||
            "Check that the backend is running and your device is connected to the same network."}
        </Text>

        <Pressable
          style={styles.notFoundButton}
          onPress={() => setReloadKey((currentKey) => currentKey + 1)}
        >
          <Text style={styles.notFoundButtonText}>Try Again</Text>
        </Pressable>

        <Pressable style={styles.errorBackButton} onPress={goBackFromResult}>
          <Text style={styles.errorBackButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.screen}>
        <LinearGradient
          colors={["#475569", "#64748B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.unknownHeader}
        >
          <View style={styles.largeCircle} />
          <View style={styles.bottomCircle} />

          <View style={styles.topRow}>
            <Pressable style={styles.headerButton} onPress={goBackFromResult}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.unknownHeaderContent}>
            <View style={styles.unknownIconBox}>
              <Ionicons name="help-circle-outline" size={32} color="#FFFFFF" />
            </View>

            <Text style={styles.unknownStatus}>Not Listed / Unverified</Text>
            <Text style={styles.unknownTitle}>Unknown Product</Text>

            <View style={styles.unknownBadge}>
              <Text style={styles.unknownBadgeText}>No FDA record found</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warningCard}>
            <View style={styles.warningIconBox}>
              <Ionicons name="shield-outline" size={22} color="#475569" />
            </View>

            <View style={styles.warningTextBox}>
              <Text style={styles.warningTitle}>Verification needed</Text>

              <Text style={styles.warningText}>
                This barcode is not available in the Codify demo database. The
                product may need manual FDA verification before purchase or use.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.ingredientsTitle}>Barcode Information</Text>

            <View style={styles.unknownInfoRow}>
              <Text style={styles.unknownInfoLabel}>Barcode</Text>
              <Text style={styles.unknownInfoValue}>{barcode}</Text>
            </View>

            <View style={styles.unknownInfoRow}>
              <Text style={styles.unknownInfoLabel}>FDA Status</Text>
              <Text style={styles.unknownInfoDanger}>No record found</Text>
            </View>

            <View style={styles.unknownInfoRowLast}>
              <Text style={styles.unknownInfoLabel}>History Status</Text>
              <Text style={styles.unknownInfoValue}>Saved as Unverified</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.ingredientsTitle}>Possible Reasons</Text>

            <View style={styles.reasonList}>
              <View style={styles.reasonRow}>
                <Ionicons name="ellipse" size={7} color="#90A1B9" />

                <Text style={styles.reasonText}>
                  Product is not registered in the demo database.
                </Text>
              </View>

              <View style={styles.reasonRow}>
                <Ionicons name="ellipse" size={7} color="#90A1B9" />

                <Text style={styles.reasonText}>
                  Barcode may be from another country or product variant.
                </Text>
              </View>

              <View style={styles.reasonRow}>
                <Ionicons name="ellipse" size={7} color="#90A1B9" />

                <Text style={styles.reasonText}>
                  Product may require manual FDA verification.
                </Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.primaryActionButton} onPress={goToScanner}>
            <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Scan Again</Text>
          </Pressable>

          <Pressable style={styles.secondaryActionButton} onPress={goToHistory}>
            <Ionicons name="time-outline" size={18} color="#4F39F6" />

            <Text numberOfLines={1} style={styles.secondaryActionText}>
              View{"\u00A0"}in{"\u00A0"}History
            </Text>
          </Pressable>

          <Pressable style={styles.reportButton} onPress={handleReportProduct}>
            <Ionicons name="flag-outline" size={18} color="#E7000B" />
            <Text style={styles.reportButtonText}>Report Product</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const statusColors = getStatusColors(product.status);
  const productImageSource = getAdvisoryImageSource(product);

  const matchedAllergens = product.allergens.filter((allergen) =>
    selectedAllergens.includes(normalizeAllergen(allergen)),
  );

  const hasPersonalAllergenAlert = matchedAllergens.length > 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={statusColors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.largeCircle} />
        <View style={styles.bottomCircle} />

        <View style={styles.topRow}>
          <Pressable style={styles.headerButton} onPress={goBackFromResult}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.productHeader}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconBox}>
              <Ionicons name={statusColors.icon} size={18} color="#FFFFFF" />
            </View>

            <Text style={styles.statusLabel}>
              {getHeaderStatusLabel(product.status)}
            </Text>
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.brandName}>{product.brand}</Text>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasPersonalAllergenAlert && (
          <View style={styles.allergenAlert}>
            <View style={styles.allergenIconBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#FFFFFF" />
            </View>

            <View style={styles.allergenTextBox}>
              <Text style={styles.allergenTitle}>⚠ Allergen Alert!</Text>

              <Text style={styles.allergenText}>
                This product contains your selected allergen
                {matchedAllergens.length > 1 ? "s" : ""}:{" "}
                {matchedAllergens.join(", ")}
              </Text>
            </View>
          </View>
        )}

        {productImageSource && (
          <View style={[styles.card, styles.productImageCard]}>
            <Image
              source={productImageSource}
              style={styles.productImage}
              contentFit="contain"
              transition={200}
            />
          </View>
        )}

        <HealthScoreCard
          product={product}
          scoreColor={statusColors.scoreColor}
        />

        <ProductSafetyCard product={product} />

        <ProductInfoCard product={product} />

        <NutritionCard product={product} />

        <IngredientsCard product={product} />

        <AlternativesCard product={product} />

        <Pressable style={styles.reportButton} onPress={handleReportProduct}>
          <Ionicons name="flag-outline" size={18} color="#E7000B" />
          <Text style={styles.reportButtonText}>Report Product</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function HealthScoreCard({
  product,
  scoreColor,
}: {
  product: DemoProduct;
  scoreColor: string;
}) {
  const healthScore = product.healthScore;

  return (
    <View style={styles.card}>
      <View style={styles.healthTopRow}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="shield-outline" size={22} color="#45556C" />
          <Text style={styles.cardTitle}>Health Score</Text>
        </View>

        <Text style={[styles.healthScore, { color: scoreColor }]}>
          {healthScore ?? "N/A"}
        </Text>
      </View>

      {healthScore === null ? (
        <Text style={styles.servingText}>
          Not enough verified nutrition data to calculate a score.
        </Text>
      ) : (
        <>
          <View style={styles.scoreTrack}>
            <LinearGradient
              colors={["#FFB900", "#FF6900"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.scoreFill,
                { width: getScoreWidth(healthScore) },
              ]}
            />
          </View>

          <View style={styles.scoreLabelRow}>
            <Text style={styles.scoreLabel}>Poor</Text>
            <Text style={styles.scoreLabel}>🟡 Moderate</Text>
            <Text style={styles.scoreLabel}>Excellent</Text>
          </View>
        </>
      )}
    </View>
  );
}

function NutritionCard({ product }: { product: DemoProduct }) {
  const nutritionRows = [
    { label: "Protein", value: product.nutrition.protein },
    { label: "Carbohydrates", value: product.nutrition.carbohydrates },
    { label: "Total Fat", value: product.nutrition.totalFat },
    { label: "Sodium", value: product.nutrition.sodium },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="flame-outline" size={22} color="#45556C" />
        <Text style={styles.cardTitle}>Nutrition Facts</Text>
      </View>

      <Text style={styles.servingText}>Per serving: {product.servingSize}</Text>

      <View style={styles.calorieRow}>
        <Text style={styles.calorieLabel}>Calories</Text>
        <Text style={styles.calorieValue}>{product.nutrition.calories}</Text>
      </View>

      <View style={styles.nutritionRows}>
        {nutritionRows.map((item, index) => {
          const isLastItem = index === nutritionRows.length - 1;

          return (
            <View
              key={item.label}
              style={[
                styles.nutritionRow,
                isLastItem && styles.nutritionRowLast,
              ]}
            >
              <Text style={styles.nutritionLabel}>{item.label}</Text>
              <Text style={styles.nutritionValue}>{item.value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ProductSafetyCard({ product }: { product: DemoProduct }) {
  const colors = getStatusNoticeColors(product.status);
  const title =
    product.status === "FDA Advisory"
      ? "FDA Public Health Warning"
      : product.status === "Caution"
        ? "Usage Precautions"
      : product.status === "Unverified"
        ? "Verification Note"
        : "Safety Notes";

  return (
    <View
      style={[
        styles.safetyCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.safetyIconBox,
          {
            backgroundColor: colors.iconBackground,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.icon}
        />
      </View>

      <View style={styles.safetyTextBox}>
        <Text style={[styles.safetyTitle, { color: colors.title }]}>
          {title}
        </Text>
        <Text style={[styles.safetyText, { color: colors.text }]}>
          {product.warningMessage}
        </Text>
      </View>
    </View>
  );
}

function ProductInfoCard({ product }: { product: DemoProduct }) {
  const hasOfficialFdaSource =
    product.status !== "Unverified" &&
    product.verificationUrl?.startsWith("https://");

  const openVerificationPage = () => {
    if (hasOfficialFdaSource && product.verificationUrl) {
      void Linking.openURL(product.verificationUrl);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.ingredientsTitle}>Product Information</Text>

      <View style={styles.infoRows}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Barcode</Text>
          <Text style={styles.infoValue}>{product.barcode}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>FDA Status</Text>
          <Text style={styles.infoValue}>{product.fdaStatusLabel}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Registration No.</Text>

          <Text numberOfLines={1} style={styles.infoValue}>
            {product.registrationNumber}
          </Text>
        </View>

        <View style={styles.infoRowLast}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{product.category}</Text>
        </View>
      </View>

      {hasOfficialFdaSource && (
        <Pressable style={styles.sourceButton} onPress={openVerificationPage}>
          <Ionicons name="open-outline" size={16} color="#4F46E5" />
          <Text style={styles.sourceButtonText}>
            {product.status === "FDA Advisory"
              ? "Open FDA advisory source"
              : "Open FDA registration source"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function IngredientsCard({ product }: { product: DemoProduct }) {
  return (
    <View style={styles.card}>
      <Text style={styles.ingredientsTitle}>Ingredients</Text>

      <View style={styles.ingredientWrap}>
        {product.ingredients.length === 0 ? (
          <Text style={styles.emptyDataText}>
            Ingredient details were not provided in the verification source.
          </Text>
        ) : (
          product.ingredients.map((ingredient) => (
            <View
              key={ingredient.name}
              style={[
                styles.ingredientPill,
                ingredient.isAllergen && styles.ingredientPillDanger,
              ]}
            >
              <Text
                style={[
                  styles.ingredientText,
                  ingredient.isAllergen && styles.ingredientTextDanger,
                ]}
              >
                {ingredient.name}
              </Text>
            </View>
          ))
        )}
      </View>

      {product.allergens.length > 0 && (
        <View style={styles.containsRow}>
          <Ionicons name="alert-circle-outline" size={18} color="#FB2C36" />

          <Text style={styles.containsText}>
            Contains:{" "}
            <Text style={styles.containsMuted}>
              {product.allergens.join(", ")}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

function AlternativesCard({ product }: { product: DemoProduct }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="bulb-outline" size={22} color="#615FFF" />
        <Text style={styles.cardTitle}>Suggested Alternatives</Text>
      </View>

      <View style={styles.alternativesList}>
        {product.alternatives.map((alternative, index) => (
          <View key={alternative} style={styles.alternativeRow}>
            <View style={styles.alternativeNumber}>
              <Text style={styles.alternativeNumberText}>{index + 1}</Text>
            </View>

            <Text style={styles.alternativeText}>{alternative}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safetyCard: {
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    borderWidth: 1.17,
    borderColor: "#E0E7FF",
    padding: 16,
    flexDirection: "row",
  },

  safetyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  safetyTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  safetyTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
    color: "#312E81",
  },

  safetyText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: "#4F39F6",
  },

  infoRows: {
    marginTop: 14,
  },

  infoRow: {
    minHeight: 42,
    borderBottomWidth: 1.17,
    borderBottomColor: "#F8FAFC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  infoRowLast: {
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  infoLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#62748E",
  },

  infoValue: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1D293D",
    textAlign: "right",
  },

  sourceButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  sourceButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#4F46E5",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    height: 306,
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

  productHeader: {
    marginTop: 24,
  },

  statusRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
  },

  statusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  statusLabel: {
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },

  productName: {
    marginTop: 12,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  brandName: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.75)",
  },

  categoryBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  categoryText: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.9)",
  },

  content: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },

  allergenAlert: {
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: "#E7000B",
    padding: 16,
    flexDirection: "row",

    shadowColor: "#FFC9C9",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },

  allergenIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  allergenTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  allergenTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  allergenText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFE2E2",
  },

  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  productImageCard: {
    padding: 0,
    overflow: "hidden",
  },

  productImage: {
    width: "100%",
    height: 260,
    backgroundColor: "#FFFFFF",
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "600",
    color: "#1D293D",
  },

  healthTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  healthScore: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
  },

  scoreTrack: {
    marginTop: 16,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },

  scoreFill: {
    height: 12,
    borderRadius: 999,
  },

  scoreLabelRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  scoreLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  servingText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: "#90A1B9",
  },

  calorieRow: {
    marginTop: 16,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  calorieLabel: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#314158",
  },

  calorieValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "900",
    color: "#1D293D",
  },

  nutritionRows: {
    marginTop: 12,
  },

  nutritionRow: {
    height: 38,
    borderBottomWidth: 1.17,
    borderBottomColor: "#F8FAFC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nutritionRowLast: {
    borderBottomWidth: 0,
  },

  nutritionLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#45556C",
  },

  nutritionValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#1D293D",
  },

  ingredientsTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "600",
    color: "#1D293D",
  },

  ingredientWrap: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  ingredientPill: {
    height: 24,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    justifyContent: "center",
  },

  ingredientPillDanger: {
    backgroundColor: "#FFE2E2",
  },

  ingredientText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#45556C",
  },

  ingredientTextDanger: {
    fontWeight: "600",
    color: "#C10007",
  },

  emptyDataText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
  },

  containsRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1.17,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  containsText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#E7000B",
  },

  containsMuted: {
    color: "#62748E",
  },

  alternativesList: {
    marginTop: 16,
    gap: 8,
  },

  alternativeRow: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  alternativeNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  alternativeNumberText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#4F39F6",
  },

  alternativeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#314158",
  },

  notFoundScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  notFoundTitle: {
    marginTop: 16,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    color: "#1D293D",
  },

  notFoundText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: "#62748E",
  },

  notFoundButton: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: "#4F39F6",
    justifyContent: "center",
    alignItems: "center",
  },

  notFoundButtonText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  errorBackButton: {
    marginTop: 12,
    height: 44,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  errorBackButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#62748E",
  },

  unknownHeader: {
    height: 306,
    paddingTop: 48,
    paddingHorizontal: 20,
    overflow: "hidden",
  },

  unknownHeaderContent: {
    marginTop: 24,
    alignItems: "center",
  },

  unknownIconBox: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  unknownStatus: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },

  unknownTitle: {
    marginTop: 6,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  unknownBadge: {
    marginTop: 12,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  unknownBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  warningCard: {
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.17,
    borderColor: "#CBD5E1",
    padding: 16,
    flexDirection: "row",
  },

  warningIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
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
    color: "#334155",
  },

  warningText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },

  unknownInfoRow: {
    minHeight: 42,
    borderBottomWidth: 1.17,
    borderBottomColor: "#F8FAFC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  unknownInfoRowLast: {
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  unknownInfoLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: "#62748E",
  },

  unknownInfoValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1D293D",
  },

  unknownInfoDanger: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#475569",
  },

  reasonList: {
    marginTop: 14,
    gap: 12,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#45556C",
  },

  primaryActionButton: {
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

  primaryActionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  secondaryActionButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    borderWidth: 1.17,
    borderColor: "#E0E7FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  secondaryActionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#4F39F6",
  },

  reportButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.17,
    borderColor: "#FFE2E2",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  reportButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#E7000B",
  },
});
