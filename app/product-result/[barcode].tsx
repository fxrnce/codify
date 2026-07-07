import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
    type DimensionValue,
} from "react-native";

import {
    DemoProduct,
    ProductStatus,
    findProductByBarcode,
} from "@/constants/MockData";

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

  return {
    gradient: ["#FB2C36", "#E7000B"] as const,
    icon: "close-circle-outline" as const,
    scoreColor: "#E7000B",
  };
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

export default function ProductResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode: string }>();

  const barcode = params.barcode ?? "";
  const product = findProductByBarcode(barcode);

  const handleShare = async () => {
    if (!product) {
      return;
    }

    await Share.share({
      message: `${product.name}\nStatus: ${product.fdaStatusLabel}\nBarcode: ${product.barcode}`,
    });
  };

  if (!product) {
    return (
      <View style={styles.notFoundScreen}>
        <Ionicons name="alert-circle-outline" size={56} color="#E7000B" />

        <Text style={styles.notFoundTitle}>Product Not Found</Text>

        <Text style={styles.notFoundText}>
          This barcode is not available in the demo database yet.
        </Text>

        <Pressable style={styles.notFoundButton} onPress={() => router.back()}>
          <Text style={styles.notFoundButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusColors = getStatusColors(product.status);

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
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
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

            <Text style={styles.statusLabel}>{product.fdaStatusLabel}</Text>

            <Text style={styles.registrationNumber}>
              {product.registrationNumber}
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
        {product.allergens.length > 0 && (
          <View style={styles.allergenAlert}>
            <View style={styles.allergenIconBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#FFFFFF" />
            </View>

            <View style={styles.allergenTextBox}>
              <Text style={styles.allergenTitle}>⚠ Allergen Alert!</Text>
              <Text style={styles.allergenText}>{product.warningMessage}</Text>
            </View>
          </View>
        )}

        <HealthScoreCard
          product={product}
          scoreColor={statusColors.scoreColor}
        />

        <NutritionCard product={product} />

        <IngredientsCard product={product} />

        <AlternativesCard product={product} />
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
  return (
    <View style={styles.card}>
      <View style={styles.healthTopRow}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="shield-outline" size={22} color="#45556C" />
          <Text style={styles.cardTitle}>Health Score</Text>
        </View>

        <Text style={[styles.healthScore, { color: scoreColor }]}>
          {product.healthScore}
        </Text>
      </View>

      <View style={styles.scoreTrack}>
        <LinearGradient
          colors={["#FFB900", "#FF6900"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.scoreFill,
            { width: getScoreWidth(product.healthScore) },
          ]}
        />
      </View>

      <View style={styles.scoreLabelRow}>
        <Text style={styles.scoreLabel}>Poor</Text>
        <Text style={styles.scoreLabel}>🟡 Moderate</Text>
        <Text style={styles.scoreLabel}>Excellent</Text>
      </View>
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

function IngredientsCard({ product }: { product: DemoProduct }) {
  return (
    <View style={styles.card}>
      <Text style={styles.ingredientsTitle}>Ingredients</Text>

      <View style={styles.ingredientWrap}>
        {product.ingredients.map((ingredient) => (
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
        ))}
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
        <Text style={styles.cardTitle}>Healthier Alternatives</Text>
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

  registrationNumber: {
    marginLeft: "auto",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.7)",
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
});
