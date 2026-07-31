type ConservativeCategory2ScoreInput = {
  servingSizeGrams: number;
  caloriesPerServing: number;
  saturatedFatGramsPerServing: number;
  totalSugarsGramsPerServing: number;
  sodiumMilligramsPerServing: number;
};

type ConservativeCategory1ScoreInput = {
  servingSizeMilliliters: number;
  caloriesPerServing: number;
  totalSugarsGramsPerServing: number;
};

const ENERGY_KJ_THRESHOLDS = [
  335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350, 3685,
];

const SATURATED_FAT_THRESHOLDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11.2, 12.5, 13.9, 15.5, 17.3, 19.3,
  21.6, 24.1, 26.9, 30, 33.5, 37.4, 41.7, 46.6, 52, 58, 64.7, 72.3,
  80.6, 90,
];

const TOTAL_SUGARS_THRESHOLDS = [
  5, 8.9, 12.8, 16.8, 20.7, 24.6, 28.5, 32.4, 36.3, 40.3, 44.2, 48.1,
  52, 55.9, 59.8, 63.8, 67.7, 71.6, 75.5, 79.4, 83.3, 87.3, 91.2,
  95.1, 99,
];

const SODIUM_THRESHOLDS = Array.from(
  { length: 30 },
  (_, index) => (index + 1) * 90,
);

function countPoints(value: number, thresholds: number[]) {
  return thresholds.filter((threshold) => value > threshold).length;
}

function category2Stars(finalHsrScore: number) {
  if (finalHsrScore <= -11) return 5;
  if (finalHsrScore <= -7) return 4.5;
  if (finalHsrScore <= -2) return 4;
  if (finalHsrScore <= 2) return 3.5;
  if (finalHsrScore <= 6) return 3;
  if (finalHsrScore <= 11) return 2.5;
  if (finalHsrScore <= 15) return 2;
  if (finalHsrScore <= 20) return 1.5;
  if (finalHsrScore <= 24) return 1;

  return 0.5;
}

function category1Stars(finalHsrScore: number) {
  if (finalHsrScore <= 0) return 4;
  if (finalHsrScore === 1) return 3.5;
  if (finalHsrScore <= 3) return 3;
  if (finalHsrScore <= 5) return 2.5;
  if (finalHsrScore <= 7) return 2;
  if (finalHsrScore <= 9) return 1.5;
  if (finalHsrScore <= 11) return 1;

  return 0.5;
}

export function calculateConservativeCategory1NutritionScore({
  servingSizeMilliliters,
  caloriesPerServing,
  totalSugarsGramsPerServing,
}: ConservativeCategory1ScoreInput) {
  if (
    !Number.isFinite(servingSizeMilliliters) ||
    servingSizeMilliliters <= 0
  ) {
    throw new Error("Serving size must be a positive number of milliliters.");
  }

  const per100MilliliterMultiplier = 100 / servingSizeMilliliters;
  const energyKilojoulesPer100Milliliters =
    caloriesPerServing * 4.184 * per100MilliliterMultiplier;
  const totalSugarsPer100Milliliters =
    totalSugarsGramsPerServing * per100MilliliterMultiplier;

  // Category 1 gives every non-water beverage at least one energy point.
  const energyPoints =
    1 +
    countPoints(
      energyKilojoulesPer100Milliliters,
      [31, 61, 91, 121, 151, 181, 211, 241, 271],
    );
  const totalSugarPoints = countPoints(totalSugarsPer100Milliliters, [
    0.1, 1.6, 3.1, 4.6, 6.1, 7.6, 9.1, 10.6, 12.1, 13.6,
  ]);

  // This conservative version awards no fruit/vegetable modifying points
  // when an eligible percentage is not present in the verified label data.
  return Math.round(category1Stars(energyPoints + totalSugarPoints) * 20);
}

export function calculateConservativeCategory2NutritionScore({
  servingSizeGrams,
  caloriesPerServing,
  saturatedFatGramsPerServing,
  totalSugarsGramsPerServing,
  sodiumMilligramsPerServing,
}: ConservativeCategory2ScoreInput) {
  if (!Number.isFinite(servingSizeGrams) || servingSizeGrams <= 0) {
    throw new Error("Serving size must be a positive number of grams.");
  }

  const per100GramMultiplier = 100 / servingSizeGrams;
  const energyKilojoulesPer100Grams =
    caloriesPerServing * 4.184 * per100GramMultiplier;
  const saturatedFatPer100Grams =
    saturatedFatGramsPerServing * per100GramMultiplier;
  const totalSugarsPer100Grams =
    totalSugarsGramsPerServing * per100GramMultiplier;
  const sodiumPer100Grams =
    sodiumMilligramsPerServing * per100GramMultiplier;

  const baselinePoints =
    countPoints(energyKilojoulesPer100Grams, ENERGY_KJ_THRESHOLDS) +
    countPoints(saturatedFatPer100Grams, SATURATED_FAT_THRESHOLDS) +
    countPoints(totalSugarsPer100Grams, TOTAL_SUGARS_THRESHOLDS) +
    countPoints(sodiumPer100Grams, SODIUM_THRESHOLDS);

  // This conservative first version awards no modifying points when exact
  // fibre, protein, or fruit/vegetable/nut/legume values are unavailable.
  return Math.round(category2Stars(baselinePoints) * 20);
}
