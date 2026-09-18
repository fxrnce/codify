/**
 * Health Star Rating (HSR) estimator.
 *
 * Codify uses the Australian/New Zealand Health Star Rating (HSR) nutrient
 * profiling method as an independent, adapted research methodology for
 * estimating the nutritional quality of packaged food and non-alcoholic
 * drink products. HSR is NOT a Philippine FDA, WHO, or DOST-FNRI scoring
 * system, and Codify is not an official HSR licensee — this module produces
 * an "HSR-based estimate", not an official Health Star Rating.
 *
 * Primary references (see docs/nutrition-rating-methodology.md for full
 * citations and access dates):
 *  - Australian Government, Health Star Rating System Implementation Guide,
 *    Version 9 (December 2025):
 *    https://www.healthstarrating.gov.au/sites/default/files/2025-12/Health%20Star%20Rating%20System%20Implementation%20Guide%20v9.pdf
 *  - Health Star Rating System, "How ratings are calculated":
 *    https://www.healthstarrating.gov.au/about/how-ratings-are-calculated
 *  - Food Standards Australia New Zealand, "Health Star Rating System":
 *    https://www.foodstandards.gov.au/consumer/labelling/Health-Star-Rating-System
 *  - Health Star Rating calculator (and its warning that consumer labels may
 *    not contain enough information for a complete rating):
 *    https://www.healthstarrating.gov.au/calculator
 *
 * The exact numeric threshold tables below were cross-verified against a
 * faithful open-source reproduction of the official calculator algorithm
 * (https://github.com/muhashi/health-star-rating) and against the official
 * anti-gaming rule text ("Products that score >=13 HSR baseline points are
 * not permitted to score points for protein unless they score five or more
 * HSR V points"), which independently confirms the same thresholds.
 */

export const HSR_METHOD_VERSION =
  "AU/NZ Health Star Rating Implementation Guide v9 (Dec 2025) — Codify HSR estimator v1.0";

export type HsrCategory =
  | "NON_DAIRY_BEVERAGE"
  | "DAIRY_BEVERAGE"
  | "FOOD"
  | "DAIRY_FOOD"
  | "FATS_OILS_SPREADS"
  | "CHEESE"
  | "PLAIN_WATER"
  | "UNSWEETENED_FLAVOURED_WATER";

export const HSR_CATEGORIES = [
  "NON_DAIRY_BEVERAGE",
  "DAIRY_BEVERAGE",
  "FOOD",
  "DAIRY_FOOD",
  "FATS_OILS_SPREADS",
  "CHEESE",
  "PLAIN_WATER",
  "UNSWEETENED_FLAVOURED_WATER",
] as const satisfies readonly HsrCategory[];

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

/** Categories measured per 100 mL rather than per 100 g. */
const LIQUID_CATEGORIES: HsrCategory[] = [
  "NON_DAIRY_BEVERAGE",
  "DAIRY_BEVERAGE",
  "PLAIN_WATER",
  "UNSWEETENED_FLAVOURED_WATER",
];

export type HsrConfidence = "COMPLETE" | "CONSERVATIVE" | "INSUFFICIENT_DATA";

export const HSR_CONSERVATIVE_NOTICE =
  "Conservative estimate: unknown beneficial components received no modifying points, so the complete rating may be higher.";

export const HSR_INSUFFICIENT_DATA_NOTICE =
  "Not enough verified nutrition data to calculate an HSR-based estimate.";

export type HsrModifyingComponent = "protein" | "fibre" | "fvnl";

export type HsrCalculationInput = {
  category: HsrCategory;
  /** Serving size as printed on the label, e.g. 14 for "14 g". */
  servingQuantity?: number | null;
  servingUnit?: "g" | "mL" | null;
  /** Energy per serving in kilocalories (as commonly printed on PH labels). */
  caloriesPerServing?: number | null;
  /** Energy per serving in kilojoules. Used instead of caloriesPerServing when available. */
  energyKilojoulesPerServing?: number | null;
  saturatedFatGramsPerServing?: number | null;
  totalSugarsGramsPerServing?: number | null;
  sodiumMilligramsPerServing?: number | null;
  /** Omit (undefined) when not verified. Do not pass an estimated/guessed value. */
  proteinGramsPerServing?: number | null;
  fibreGramsPerServing?: number | null;
  /** Verified percentage (0-100) of the product that is fruit, vegetable, nut, or legume. */
  fvnlPercent?: number | null;
  containsFruitOrVegetable?: boolean;
  containsNutsOrLegumes?: boolean;
};

export type HsrStandardizedValues = {
  perUnitLabel: "100 g" | "100 mL";
  energyKilojoules: number;
  saturatedFatGrams: number | null;
  totalSugarsGrams: number | null;
  sodiumMilligrams: number | null;
  proteinGrams: number | null;
  fibreGrams: number | null;
};

export type HsrPointsBreakdown = {
  baselinePoints: number;
  energyPoints: number;
  saturatedFatPoints: number | null;
  sugarPoints: number;
  sodiumPoints: number | null;
  proteinPoints: number;
  fibrePoints: number;
  fvnlPoints: number;
  finalPoints: number;
};

export type HsrCalculationResult = {
  methodVersion: string;
  category: HsrCategory;
  confidence: HsrConfidence;
  /** Present when confidence is INSUFFICIENT_DATA, explaining what is missing. */
  reason?: string;
  standardized?: HsrStandardizedValues;
  points?: HsrPointsBreakdown;
  /** Beneficial components that were eligible but not verified, so scored as 0. */
  unavailableComponents: HsrModifyingComponent[];
  /** True when protein points were withheld by the official baseline>=13 rule, not by missing data. */
  proteinPointsWithheldByRule: boolean;
  starRating: number | null;
  /** Unambiguous integer representation: 1 = 0.5 star ... 10 = 5 stars. */
  starRatingHalfSteps: number | null;
};

function pointsFromThresholds(value: number, thresholds: number[]): number {
  return thresholds.filter((threshold) => value > threshold).length;
}

// --- Baseline point threshold tables --------------------------------------

const COMMON_ENERGY_KJ_THRESHOLDS = [
  335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350, 3685,
];

const SOLID_SATURATED_FAT_THRESHOLDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11.2, 12.5, 13.9, 15.5, 17.3, 19.3, 21.6,
  24.1, 26.9, 30, 33.5, 37.4, 41.7, 46.6, 52, 58, 64.7, 72.3, 80.6, 90,
];

const SOLID_TOTAL_SUGARS_THRESHOLDS = [
  5, 8.9, 12.8, 16.8, 20.7, 24.6, 28.5, 32.4, 36.3, 40.3, 44.2, 48.1, 52,
  55.9, 59.8, 63.8, 67.7, 71.6, 75.5, 79.4, 83.3, 87.3, 91.2, 95.1, 99,
];

const COMMON_SODIUM_MG_THRESHOLDS = Array.from(
  { length: 30 },
  (_, index) => (index + 1) * 90,
);

const OIL_SATURATED_FAT_THRESHOLDS = Array.from(
  { length: 30 },
  (_, index) => index + 1,
);

const OIL_TOTAL_SUGARS_THRESHOLDS = [5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];

// The official beverage energy table has a leading -1 kJ sentinel (so a
// beverage always scores at least 1 baseline point from energy). Adding a
// fixed +1 to the count above these 9 thresholds is algebraically identical.
const BEVERAGE_ENERGY_KJ_THRESHOLDS = [31, 61, 91, 121, 151, 181, 211, 241, 271];

const BEVERAGE_TOTAL_SUGARS_THRESHOLDS = [
  0.1, 1.6, 3.1, 4.6, 6.1, 7.6, 9.1, 10.6, 12.1, 13.6,
];

// --- Modifying point threshold tables --------------------------------------

const PROTEIN_THRESHOLDS = [
  1.6, 3.1, 4.8, 6.4, 8, 9.6, 11.6, 13.9, 16.7, 20, 24, 28.9, 34.7, 41.6, 50,
];

const FIBRE_THRESHOLDS = [
  0.9, 1.9, 2.8, 3.7, 4.7, 5.4, 6.3, 7.3, 8.4, 9.7, 11.2, 13, 15, 17.3, 20,
];

const FVNL_FRUIT_VEG_THRESHOLDS = [25, 43, 52, 63, 67, 80, 90, 100];
const FVNL_NUTS_LEGUMES_THRESHOLDS = [40, 60, 67, 75, 80, 90, 95, 100];
const FVNL_BEVERAGE_THRESHOLDS = [25, 33, 41, 49, 57, 65, 73, 81, 89, 96];

// --- Final score -> star rating conversion tables --------------------------

const STAR_RATINGS = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5];

const CATEGORY_STAR_POINT_RANGES: Record<
  Exclude<HsrCategory, "PLAIN_WATER" | "UNSWEETENED_FLAVOURED_WATER">,
  number[]
> = {
  // The first two bands are unreachable through the general formula: 5 and
  // 4.5 stars for non-dairy beverages are only ever awarded through the
  // PLAIN_WATER / UNSWEETENED_FLAVOURED_WATER special cases below.
  NON_DAIRY_BEVERAGE: [-Infinity, -Infinity, 0, 1, 3, 5, 7, 9, 11, 12],
  DAIRY_BEVERAGE: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7],
  FOOD: [-11, -7, -2, 2, 6, 11, 15, 20, 24, 25],
  DAIRY_FOOD: [-2, 0, 2, 3, 5, 7, 8, 10, 12, 13],
  FATS_OILS_SPREADS: [13, 16, 20, 23, 27, 30, 34, 37, 41, 42],
  CHEESE: [24, 26, 28, 30, 31, 33, 35, 37, 39, 40],
};

function ratingFromFinalPoints(
  category: Exclude<HsrCategory, "PLAIN_WATER" | "UNSWEETENED_FLAVOURED_WATER">,
  finalPoints: number,
) {
  const pointRange = CATEGORY_STAR_POINT_RANGES[category];
  const roundedPoints = Math.round(finalPoints);
  const index = pointRange.findIndex((threshold) => roundedPoints <= threshold);
  const rating = index >= 0 ? STAR_RATINGS[index] : STAR_RATINGS[STAR_RATINGS.length - 1];
  return { starRating: rating, starRatingHalfSteps: Math.round(rating * 2) };
}

function requiresSaturatedFatAndSodium(category: HsrCategory) {
  return category !== "NON_DAIRY_BEVERAGE";
}

function isEligibleForFibrePoints(category: HsrCategory) {
  return category !== "NON_DAIRY_BEVERAGE" && category !== "DAIRY_BEVERAGE";
}

function isEligibleForProteinPoints(category: HsrCategory) {
  return category !== "NON_DAIRY_BEVERAGE";
}

/**
 * Calculates an HSR-based nutrition rating estimate for one product.
 *
 * This never throws: invalid, missing, or non-numeric input simply produces
 * an INSUFFICIENT_DATA result, per the "missing-data policy" — Codify must
 * never silently award beneficial modifying points, or a rating at all, when
 * the required verified inputs are not present.
 */
export function calculateHealthStarRating(
  input: HsrCalculationInput,
): HsrCalculationResult {
  const base = {
    methodVersion: HSR_METHOD_VERSION,
    category: input.category,
    unavailableComponents: [] as HsrModifyingComponent[],
    proteinPointsWithheldByRule: false,
    starRating: null,
    starRatingHalfSteps: null,
  };

  if (input.category === "PLAIN_WATER") {
    return {
      ...base,
      confidence: "COMPLETE",
      starRating: 5,
      starRatingHalfSteps: 10,
    };
  }

  if (input.category === "UNSWEETENED_FLAVOURED_WATER") {
    return {
      ...base,
      confidence: "COMPLETE",
      starRating: 4.5,
      starRatingHalfSteps: 9,
    };
  }

  const perUnitLabel = LIQUID_CATEGORIES.includes(input.category)
    ? ("100 mL" as const)
    : ("100 g" as const);
  const expectedUnit = perUnitLabel === "100 mL" ? "mL" : "g";

  if (
    !Number.isFinite(input.servingQuantity) ||
    (input.servingQuantity as number) <= 0
  ) {
    return {
      ...base,
      confidence: "INSUFFICIENT_DATA",
      reason: "The serving quantity is missing, zero, or not a valid number.",
    };
  }

  if (input.servingUnit !== "g" && input.servingUnit !== "mL") {
    return {
      ...base,
      confidence: "INSUFFICIENT_DATA",
      reason: "The serving unit must be verified as grams (g) or millilitres (mL).",
    };
  }

  if (input.servingUnit !== expectedUnit) {
    return {
      ...base,
      confidence: "INSUFFICIENT_DATA",
      reason: `${HSR_CATEGORY_LABELS[input.category]} products must be measured in ${expectedUnit}, not ${input.servingUnit}.`,
    };
  }

  const servingQuantity = input.servingQuantity as number;
  const multiplier = 100 / servingQuantity;

  const energyKilojoulesPerServing = Number.isFinite(input.energyKilojoulesPerServing)
    ? (input.energyKilojoulesPerServing as number)
    : Number.isFinite(input.caloriesPerServing)
      ? (input.caloriesPerServing as number) * 4.184
      : null;

  if (energyKilojoulesPerServing === null || energyKilojoulesPerServing < 0) {
    return {
      ...base,
      confidence: "INSUFFICIENT_DATA",
      reason: "A verified energy value (calories or kilojoules) per serving is required.",
    };
  }

  const totalSugarsGramsPerServing = input.totalSugarsGramsPerServing;
  if (!Number.isFinite(totalSugarsGramsPerServing) || (totalSugarsGramsPerServing as number) < 0) {
    return {
      ...base,
      confidence: "INSUFFICIENT_DATA",
      reason: "A verified total sugars value per serving is required.",
    };
  }

  let saturatedFatGramsPerServing: number | null = null;
  let sodiumMilligramsPerServing: number | null = null;

  if (requiresSaturatedFatAndSodium(input.category)) {
    if (
      !Number.isFinite(input.saturatedFatGramsPerServing) ||
      (input.saturatedFatGramsPerServing as number) < 0
    ) {
      return {
        ...base,
        confidence: "INSUFFICIENT_DATA",
        reason: "A verified saturated fat value per serving is required.",
      };
    }
    if (
      !Number.isFinite(input.sodiumMilligramsPerServing) ||
      (input.sodiumMilligramsPerServing as number) < 0
    ) {
      return {
        ...base,
        confidence: "INSUFFICIENT_DATA",
        reason: "A verified sodium value per serving is required.",
      };
    }
    saturatedFatGramsPerServing = input.saturatedFatGramsPerServing as number;
    sodiumMilligramsPerServing = input.sodiumMilligramsPerServing as number;
  }

  const energyKilojoules = energyKilojoulesPerServing * multiplier;
  const totalSugarsGrams = (totalSugarsGramsPerServing as number) * multiplier;
  const saturatedFatGrams =
    saturatedFatGramsPerServing === null ? null : saturatedFatGramsPerServing * multiplier;
  const sodiumMilligrams =
    sodiumMilligramsPerServing === null ? null : sodiumMilligramsPerServing * multiplier;
  const proteinGrams = Number.isFinite(input.proteinGramsPerServing)
    ? (input.proteinGramsPerServing as number) * multiplier
    : null;
  const fibreGrams = Number.isFinite(input.fibreGramsPerServing)
    ? (input.fibreGramsPerServing as number) * multiplier
    : null;

  const standardized: HsrStandardizedValues = {
    perUnitLabel,
    energyKilojoules,
    saturatedFatGrams,
    totalSugarsGrams,
    sodiumMilligrams,
    proteinGrams,
    fibreGrams,
  };

  // --- Baseline points ------------------------------------------------
  let energyPoints: number;
  let saturatedFatPoints: number | null = null;
  let sugarPoints: number;
  let sodiumPoints: number | null = null;

  if (input.category === "NON_DAIRY_BEVERAGE") {
    energyPoints = 1 + pointsFromThresholds(energyKilojoules, BEVERAGE_ENERGY_KJ_THRESHOLDS);
    sugarPoints = pointsFromThresholds(totalSugarsGrams, BEVERAGE_TOTAL_SUGARS_THRESHOLDS);
  } else if (
    input.category === "DAIRY_BEVERAGE" ||
    input.category === "FOOD" ||
    input.category === "DAIRY_FOOD"
  ) {
    energyPoints = pointsFromThresholds(energyKilojoules, COMMON_ENERGY_KJ_THRESHOLDS);
    saturatedFatPoints = pointsFromThresholds(saturatedFatGrams as number, SOLID_SATURATED_FAT_THRESHOLDS);
    sugarPoints = pointsFromThresholds(totalSugarsGrams, SOLID_TOTAL_SUGARS_THRESHOLDS);
    sodiumPoints = pointsFromThresholds(sodiumMilligrams as number, COMMON_SODIUM_MG_THRESHOLDS);
  } else {
    // FATS_OILS_SPREADS, CHEESE
    energyPoints = pointsFromThresholds(energyKilojoules, COMMON_ENERGY_KJ_THRESHOLDS);
    saturatedFatPoints = pointsFromThresholds(saturatedFatGrams as number, OIL_SATURATED_FAT_THRESHOLDS);
    sugarPoints = pointsFromThresholds(totalSugarsGrams, OIL_TOTAL_SUGARS_THRESHOLDS);
    sodiumPoints = pointsFromThresholds(sodiumMilligrams as number, COMMON_SODIUM_MG_THRESHOLDS);
  }

  const baselinePoints = energyPoints + (saturatedFatPoints ?? 0) + sugarPoints + (sodiumPoints ?? 0);

  // --- FVNL modifying points -------------------------------------------
  const unavailableComponents: HsrModifyingComponent[] = [];
  let fvnlPoints = 0;

  const hasFvnlAttribute = input.containsFruitOrVegetable || input.containsNutsOrLegumes;

  if (Number.isFinite(input.fvnlPercent)) {
    const fvnlPercent = input.fvnlPercent as number;
    if (hasFvnlAttribute) {
      if (input.category === "NON_DAIRY_BEVERAGE") {
        fvnlPoints = pointsFromThresholds(fvnlPercent, FVNL_BEVERAGE_THRESHOLDS);
      } else if (input.containsFruitOrVegetable) {
        fvnlPoints = pointsFromThresholds(fvnlPercent, FVNL_FRUIT_VEG_THRESHOLDS);
      } else {
        fvnlPoints = pointsFromThresholds(fvnlPercent, FVNL_NUTS_LEGUMES_THRESHOLDS);
      }
    }
  } else {
    unavailableComponents.push("fvnl");
  }

  // --- Protein modifying points (subject to the baseline>=13 rule) -----
  let proteinPoints = 0;
  let proteinPointsWithheldByRule = false;

  if (isEligibleForProteinPoints(input.category)) {
    if (baselinePoints >= 13 && fvnlPoints < 5) {
      proteinPointsWithheldByRule = true;
    } else if (proteinGrams !== null) {
      proteinPoints = pointsFromThresholds(proteinGrams, PROTEIN_THRESHOLDS);
    } else {
      unavailableComponents.push("protein");
    }
  }

  // --- Fibre modifying points -------------------------------------------
  let fibrePoints = 0;

  if (isEligibleForFibrePoints(input.category)) {
    if (fibreGrams !== null) {
      fibrePoints = pointsFromThresholds(fibreGrams, FIBRE_THRESHOLDS);
    } else {
      unavailableComponents.push("fibre");
    }
  }

  const finalPoints = baselinePoints - proteinPoints - fibrePoints - fvnlPoints;
  const { starRating, starRatingHalfSteps } = ratingFromFinalPoints(
    input.category,
    finalPoints,
  );

  const confidence: HsrConfidence =
    unavailableComponents.length > 0 ? "CONSERVATIVE" : "COMPLETE";

  return {
    ...base,
    confidence,
    standardized,
    points: {
      baselinePoints,
      energyPoints,
      saturatedFatPoints,
      sugarPoints,
      sodiumPoints,
      proteinPoints,
      fibrePoints,
      fvnlPoints,
      finalPoints,
    },
    unavailableComponents,
    proteinPointsWithheldByRule,
    starRating,
    starRatingHalfSteps,
  };
}

/** Converts a stored 1-10 half-step integer back to a 0.5-5 star number. */
export function starRatingFromHalfSteps(halfSteps: number) {
  return halfSteps / 2;
}

/**
 * Runs the verified input through calculateHealthStarRating() and flattens
 * the result into the exact column shape of the Prisma NutritionRating
 * model, for a create/update payload. The backend always derives every
 * computed field this way — nothing here is ever taken directly from an
 * administrator-submitted score.
 */
export function buildNutritionRatingData(input: HsrCalculationInput) {
  const result = calculateHealthStarRating(input);

  return {
    category: input.category,
    confidence: result.confidence,
    methodVersion: result.methodVersion,
    reason: result.reason ?? null,

    servingQuantity: input.servingQuantity ?? null,
    servingUnit: input.servingUnit ?? null,
    caloriesPerServing: input.caloriesPerServing ?? null,
    saturatedFatGramsPerServing: input.saturatedFatGramsPerServing ?? null,
    totalSugarsGramsPerServing: input.totalSugarsGramsPerServing ?? null,
    sodiumMilligramsPerServing: input.sodiumMilligramsPerServing ?? null,
    proteinGramsPerServing: input.proteinGramsPerServing ?? null,
    fibreGramsPerServing: input.fibreGramsPerServing ?? null,
    fvnlPercent: input.fvnlPercent ?? null,
    containsFruitOrVegetable: input.containsFruitOrVegetable ?? false,
    containsNutsOrLegumes: input.containsNutsOrLegumes ?? false,

    energyKilojoulesPer100: result.standardized?.energyKilojoules ?? null,
    saturatedFatGramsPer100: result.standardized?.saturatedFatGrams ?? null,
    totalSugarsGramsPer100: result.standardized?.totalSugarsGrams ?? null,
    sodiumMilligramsPer100: result.standardized?.sodiumMilligrams ?? null,
    proteinGramsPer100: result.standardized?.proteinGrams ?? null,
    fibreGramsPer100: result.standardized?.fibreGrams ?? null,

    baselinePoints: result.points?.baselinePoints ?? null,
    proteinPoints: result.points?.proteinPoints ?? null,
    fibrePoints: result.points?.fibrePoints ?? null,
    fvnlPoints: result.points?.fvnlPoints ?? null,
    finalPoints: result.points?.finalPoints ?? null,
    proteinPointsWithheldByRule: result.proteinPointsWithheldByRule,
    unavailableComponents: result.unavailableComponents,

    starRatingHalfSteps: result.starRatingHalfSteps,
  };
}

/**
 * Shape of a persisted NutritionRating row (see prisma/schema.prisma). Kept
 * as a plain structural type here, rather than importing the generated
 * Prisma model, so this module has no dependency on the Prisma client.
 */
export type StoredNutritionRating = {
  category: HsrCategory;
  confidence: HsrConfidence;
  methodVersion: string;
  reason: string | null;
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
  energyKilojoulesPer100: number | null;
  saturatedFatGramsPer100: number | null;
  totalSugarsGramsPer100: number | null;
  sodiumMilligramsPer100: number | null;
  proteinGramsPer100: number | null;
  fibreGramsPer100: number | null;
  baselinePoints: number | null;
  proteinPoints: number | null;
  fibrePoints: number | null;
  fvnlPoints: number | null;
  finalPoints: number | null;
  proteinPointsWithheldByRule: boolean;
  unavailableComponents: string[];
  starRatingHalfSteps: number | null;
  calculatedAt: Date;
};

/** The shape returned to mobile/admin clients for a product's nutrition rating. */
export type ApiNutritionRating = {
  category: HsrCategory;
  categoryLabel: string;
  confidence: HsrConfidence;
  reason: string | null;
  methodVersion: string;
  starRating: number | null;
  calculatedAt: string;
  input: {
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
  standardized: {
    perUnitLabel: "100 g" | "100 mL";
    energyKilojoules: number | null;
    saturatedFatGrams: number | null;
    totalSugarsGrams: number | null;
    sodiumMilligrams: number | null;
    proteinGrams: number | null;
    fibreGrams: number | null;
  } | null;
  points: {
    baselinePoints: number;
    proteinPoints: number;
    fibrePoints: number;
    fvnlPoints: number;
    finalPoints: number;
  } | null;
  unavailableComponents: string[];
  proteinPointsWithheldByRule: boolean;
};

/** Maps a stored NutritionRating row to the API/UI-facing representation. */
export function mapNutritionRatingToApi(
  rating: StoredNutritionRating,
): ApiNutritionRating {
  const perUnitLabel = LIQUID_CATEGORIES.includes(rating.category)
    ? ("100 mL" as const)
    : ("100 g" as const);

  const hasStandardized =
    rating.category !== "PLAIN_WATER" &&
    rating.category !== "UNSWEETENED_FLAVOURED_WATER" &&
    rating.confidence !== "INSUFFICIENT_DATA";

  return {
    category: rating.category,
    categoryLabel: HSR_CATEGORY_LABELS[rating.category],
    confidence: rating.confidence,
    reason: rating.reason,
    methodVersion: rating.methodVersion,
    starRating:
      rating.starRatingHalfSteps === null
        ? null
        : starRatingFromHalfSteps(rating.starRatingHalfSteps),
    calculatedAt: rating.calculatedAt.toISOString(),
    input: {
      servingQuantity: rating.servingQuantity,
      servingUnit: rating.servingUnit,
      caloriesPerServing: rating.caloriesPerServing,
      saturatedFatGramsPerServing: rating.saturatedFatGramsPerServing,
      totalSugarsGramsPerServing: rating.totalSugarsGramsPerServing,
      sodiumMilligramsPerServing: rating.sodiumMilligramsPerServing,
      proteinGramsPerServing: rating.proteinGramsPerServing,
      fibreGramsPerServing: rating.fibreGramsPerServing,
      fvnlPercent: rating.fvnlPercent,
      containsFruitOrVegetable: rating.containsFruitOrVegetable,
      containsNutsOrLegumes: rating.containsNutsOrLegumes,
    },
    standardized: hasStandardized
      ? {
          perUnitLabel,
          energyKilojoules: rating.energyKilojoulesPer100,
          saturatedFatGrams: rating.saturatedFatGramsPer100,
          totalSugarsGrams: rating.totalSugarsGramsPer100,
          sodiumMilligrams: rating.sodiumMilligramsPer100,
          proteinGrams: rating.proteinGramsPer100,
          fibreGrams: rating.fibreGramsPer100,
        }
      : null,
    points:
      rating.baselinePoints === null || rating.finalPoints === null
        ? null
        : {
            baselinePoints: rating.baselinePoints,
            proteinPoints: rating.proteinPoints ?? 0,
            fibrePoints: rating.fibrePoints ?? 0,
            fvnlPoints: rating.fvnlPoints ?? 0,
            finalPoints: rating.finalPoints,
          },
    unavailableComponents: rating.unavailableComponents,
    proteinPointsWithheldByRule: rating.proteinPointsWithheldByRule,
  };
}
