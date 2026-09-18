// Mirrors backend/src/lib/nutrition-score.ts's ApiNutritionRating shape.
// Codify's nutrition rating is an independent HSR-based (Australia/New
// Zealand Health Star Rating) estimate, not a Philippine FDA, WHO, or
// DOST-FNRI score. See docs/nutrition-rating-methodology.md.

export type HsrCategory =
  | "NON_DAIRY_BEVERAGE"
  | "DAIRY_BEVERAGE"
  | "FOOD"
  | "DAIRY_FOOD"
  | "FATS_OILS_SPREADS"
  | "CHEESE"
  | "PLAIN_WATER"
  | "UNSWEETENED_FLAVOURED_WATER";

export const HSR_CATEGORIES: HsrCategory[] = [
  "NON_DAIRY_BEVERAGE",
  "DAIRY_BEVERAGE",
  "FOOD",
  "DAIRY_FOOD",
  "FATS_OILS_SPREADS",
  "CHEESE",
  "PLAIN_WATER",
  "UNSWEETENED_FLAVOURED_WATER",
];

export type HsrConfidence = "COMPLETE" | "CONSERVATIVE" | "INSUFFICIENT_DATA";

export const HSR_CATEGORY_LABELS: Record<HsrCategory, string> = {
  NON_DAIRY_BEVERAGE: "Non-dairy beverage (HSR Category 1)",
  DAIRY_BEVERAGE: "Dairy beverage (HSR Category 1D)",
  FOOD: "General food (HSR Category 2)",
  DAIRY_FOOD: "Dairy food (HSR Category 2D)",
  FATS_OILS_SPREADS: "Oils, spreads and dressings (HSR Category 3)",
  CHEESE: "Cheese (HSR Category 3D)",
  PLAIN_WATER: "Plain water (automatic maximum rating)",
  UNSWEETENED_FLAVOURED_WATER:
    "Unsweetened flavoured water (automatic near-maximum rating)",
};

export const HSR_CONSERVATIVE_NOTICE =
  "Conservative estimate: unknown beneficial components received no modifying points, so the complete rating may be higher.";

export const HSR_INSUFFICIENT_DATA_NOTICE =
  "Not enough verified nutrition data to calculate an HSR-based estimate.";

export const HSR_COMPARISON_REMINDER =
  "Compare this rating only with other products in the same category (for example, compare drinks with drinks, not with snacks).";

export type NutritionRatingComponent = "protein" | "fibre" | "fvnl";

export type NutritionRatingInput = {
  servingQuantity: number | null;
  servingUnit: string | null;
  caloriesPerServing: number | null;
  saturatedFatGramsPerServing: number | null;
  totalSugarsGramsPerServing: number | null;
  sodiumMilligramsPerServing: number | null;
  proteinGramsPerServing: number | null;
  fibreGramsPerServing: number | null;
  fvnlPercent: number | null;
  containsFruitOrVegetable: boolean;
  containsNutsOrLegumes: boolean;
};

export type NutritionRatingStandardized = {
  perUnitLabel: "100 g" | "100 mL";
  energyKilojoules: number | null;
  saturatedFatGrams: number | null;
  totalSugarsGrams: number | null;
  sodiumMilligrams: number | null;
  proteinGrams: number | null;
  fibreGrams: number | null;
};

export type NutritionRatingPoints = {
  baselinePoints: number;
  proteinPoints: number;
  fibrePoints: number;
  fvnlPoints: number;
  finalPoints: number;
};

export type NutritionRating = {
  category: HsrCategory;
  categoryLabel: string;
  confidence: HsrConfidence;
  reason: string | null;
  methodVersion: string;
  starRating: number | null;
  calculatedAt: string;
  input: NutritionRatingInput;
  standardized: NutritionRatingStandardized | null;
  points: NutritionRatingPoints | null;
  unavailableComponents: NutritionRatingComponent[];
  proteinPointsWithheldByRule: boolean;
};
