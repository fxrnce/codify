import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateHealthStarRating,
  starRatingFromHalfSteps,
} from "../src/lib/nutrition-score.js";

test("converts a per-serving value to per 100 g using the serving quantity", () => {
  const result = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 50,
    servingUnit: "g",
    caloriesPerServing: 100,
    saturatedFatGramsPerServing: 2,
    totalSugarsGramsPerServing: 5,
    sodiumMilligramsPerServing: 100,
  });

  assert.equal(result.confidence, "CONSERVATIVE");
  // 50 g -> 100 g multiplier is x2.
  assert.equal(result.standardized?.saturatedFatGrams, 4);
  assert.equal(result.standardized?.totalSugarsGrams, 10);
  assert.equal(result.standardized?.sodiumMilligrams, 200);
  assert.equal(result.standardized?.perUnitLabel, "100 g");
});

test("converts a per-serving value to per 100 mL for a beverage", () => {
  const result = calculateHealthStarRating({
    category: "NON_DAIRY_BEVERAGE",
    servingQuantity: 250,
    servingUnit: "mL",
    caloriesPerServing: 50,
    totalSugarsGramsPerServing: 12,
  });

  assert.equal(result.standardized?.perUnitLabel, "100 mL");
  // 250 mL -> 100 mL multiplier is x0.4.
  assert.ok(Math.abs((result.standardized?.totalSugarsGrams ?? 0) - 4.8) < 1e-9);
});

test("converts calories to kilojoules using the official 4.184 factor", () => {
  const result = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 100,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });

  assert.ok(Math.abs((result.standardized?.energyKilojoules ?? 0) - 418.4) < 1e-9);
});

test("accepts kilojoules directly when provided instead of calories", () => {
  const result = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    energyKilojoulesPerServing: 500,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });

  assert.equal(result.standardized?.energyKilojoules, 500);
});

test("energy baseline points: value exactly at a threshold does not score that band", () => {
  const atThreshold = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    energyKilojoulesPerServing: 335,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });
  assert.equal(atThreshold.points?.energyPoints, 0);

  const justAbove = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    energyKilojoulesPerServing: 335.01,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });
  assert.equal(justAbove.points?.energyPoints, 1);
});

test("saturated fat baseline points: boundary just below and above 1g", () => {
  const below = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 0,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });
  assert.equal(below.points?.saturatedFatPoints, 0);

  const above = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 0,
    saturatedFatGramsPerServing: 1.01,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });
  assert.equal(above.points?.saturatedFatPoints, 1);
});

test("sodium baseline points: boundary just below and above 90mg", () => {
  const below = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 0,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 90,
  });
  assert.equal(below.points?.sodiumPoints, 0);

  const above = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 0,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 90.5,
  });
  assert.equal(above.points?.sodiumPoints, 1);
});

test("ordinary food calculation matches the official Category 2 star bands", () => {
  // baseline points chosen to land exactly at each documented band edge.
  const veryHighBaseline = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    energyKilojoulesPerServing: 3685,
    saturatedFatGramsPerServing: 90,
    totalSugarsGramsPerServing: 99,
    sodiumMilligramsPerServing: 2700,
  });
  // Each nutrient table has its own length (11/30/25/30 thresholds); baseline
  // points are not capped at 10 per component. At the top of every table:
  // energy 10 + saturated fat 29 + sugar 24 + sodium 29 = 92.
  assert.equal(veryHighBaseline.points?.baselinePoints, 92);
  assert.equal(veryHighBaseline.starRating, 0.5);

  const zeroEverything = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 0,
    saturatedFatGramsPerServing: 0,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 0,
  });
  assert.equal(zeroEverything.points?.baselinePoints, 0);
  assert.equal(zeroEverything.starRating, 3.5);
});

test("non-dairy beverage calculation uses only energy and sugar", () => {
  const result = calculateHealthStarRating({
    category: "NON_DAIRY_BEVERAGE",
    servingQuantity: 100,
    servingUnit: "mL",
    caloriesPerServing: 0,
    totalSugarsGramsPerServing: 0,
  });

  assert.equal(result.points?.saturatedFatPoints, null);
  assert.equal(result.points?.sodiumPoints, null);
  // Beverages always score at least 1 baseline energy point.
  assert.equal(result.points?.energyPoints, 1);
  assert.equal(result.starRating, 3.5);
});

test("non-dairy beverage general formula cannot reach 5 or 4.5 stars", () => {
  const result = calculateHealthStarRating({
    category: "NON_DAIRY_BEVERAGE",
    servingQuantity: 100,
    servingUnit: "mL",
    caloriesPerServing: 0,
    totalSugarsGramsPerServing: 0,
  });

  assert.notEqual(result.starRating, 5);
  assert.notEqual(result.starRating, 4.5);
});

test("plain water is an automatic 5-star special case", () => {
  const result = calculateHealthStarRating({ category: "PLAIN_WATER" });
  assert.equal(result.confidence, "COMPLETE");
  assert.equal(result.starRating, 5);
  assert.equal(result.starRatingHalfSteps, 10);
});

test("unsweetened flavoured water is an automatic 4.5-star special case", () => {
  const result = calculateHealthStarRating({
    category: "UNSWEETENED_FLAVOURED_WATER",
  });
  assert.equal(result.starRating, 4.5);
  assert.equal(result.starRatingHalfSteps, 9);
});

test("dairy beverage, dairy food, oils/spreads, and cheese categories calculate", () => {
  const dairyBeverage = calculateHealthStarRating({
    category: "DAIRY_BEVERAGE",
    servingQuantity: 100,
    servingUnit: "mL",
    caloriesPerServing: 60,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 6,
    sodiumMilligramsPerServing: 50,
  });
  assert.equal(dairyBeverage.confidence, "CONSERVATIVE");
  assert.ok(typeof dairyBeverage.starRating === "number");

  const dairyFood = calculateHealthStarRating({
    category: "DAIRY_FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 60,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 6,
    sodiumMilligramsPerServing: 50,
  });
  assert.ok(typeof dairyFood.starRating === "number");

  const oil = calculateHealthStarRating({
    category: "FATS_OILS_SPREADS",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 800,
    saturatedFatGramsPerServing: 10,
    totalSugarsGramsPerServing: 0,
    sodiumMilligramsPerServing: 10,
  });
  assert.ok(typeof oil.starRating === "number");

  const cheese = calculateHealthStarRating({
    category: "CHEESE",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 400,
    saturatedFatGramsPerServing: 20,
    totalSugarsGramsPerServing: 1,
    sodiumMilligramsPerServing: 600,
  });
  assert.ok(typeof cheese.starRating === "number");
});

test("verified protein, fibre, and FVNL values reduce the final score as modifying points", () => {
  const input = {
    category: "FOOD" as const,
    servingQuantity: 100,
    servingUnit: "g" as const,
    caloriesPerServing: 200,
    saturatedFatGramsPerServing: 2,
    totalSugarsGramsPerServing: 5,
    sodiumMilligramsPerServing: 100,
  };

  const withoutModifiers = calculateHealthStarRating(input);
  const withModifiers = calculateHealthStarRating({
    ...input,
    proteinGramsPerServing: 20,
    fibreGramsPerServing: 10,
    fvnlPercent: 90,
    containsFruitOrVegetable: true,
  });

  assert.equal(withoutModifiers.confidence, "CONSERVATIVE");
  assert.equal(withModifiers.confidence, "COMPLETE");
  assert.ok((withModifiers.points?.finalPoints ?? 0) < (withoutModifiers.points?.finalPoints ?? 0));
  assert.deepEqual(withoutModifiers.unavailableComponents.sort(), ["fibre", "fvnl", "protein"]);
  assert.deepEqual(withModifiers.unavailableComponents, []);
});

test("baseline >= 13 withholds protein points unless FVNL points reach 5", () => {
  const highBaselineNoFvnl = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    energyKilojoulesPerServing: 3000,
    saturatedFatGramsPerServing: 20,
    totalSugarsGramsPerServing: 40,
    sodiumMilligramsPerServing: 1000,
    proteinGramsPerServing: 30,
  });
  assert.ok((highBaselineNoFvnl.points?.baselinePoints ?? 0) >= 13);
  assert.equal(highBaselineNoFvnl.proteinPointsWithheldByRule, true);
  assert.equal(highBaselineNoFvnl.points?.proteinPoints, 0);
  // The rule applies regardless of whether protein was verified, so this is
  // not treated as missing data.
  assert.ok(!highBaselineNoFvnl.unavailableComponents.includes("protein"));

  const highBaselineWithFvnl = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    energyKilojoulesPerServing: 3000,
    saturatedFatGramsPerServing: 20,
    totalSugarsGramsPerServing: 40,
    sodiumMilligramsPerServing: 1000,
    proteinGramsPerServing: 30,
    fvnlPercent: 90,
    containsFruitOrVegetable: true,
  });
  assert.equal(highBaselineWithFvnl.proteinPointsWithheldByRule, false);
  assert.ok((highBaselineWithFvnl.points?.proteinPoints ?? 0) > 0);
});

test("missing required baseline data returns INSUFFICIENT_DATA and no rating", () => {
  const missingSugar = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 100,
    servingUnit: "g",
    caloriesPerServing: 100,
    saturatedFatGramsPerServing: 1,
    sodiumMilligramsPerServing: 50,
  });
  assert.equal(missingSugar.confidence, "INSUFFICIENT_DATA");
  assert.equal(missingSugar.starRating, null);
  assert.ok(missingSugar.reason);

  const missingEnergy = calculateHealthStarRating({
    category: "NON_DAIRY_BEVERAGE",
    servingQuantity: 250,
    servingUnit: "mL",
    totalSugarsGramsPerServing: 10,
  });
  assert.equal(missingEnergy.confidence, "INSUFFICIENT_DATA");
});

test("invalid or zero serving size returns INSUFFICIENT_DATA", () => {
  const zero = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 0,
    servingUnit: "g",
    caloriesPerServing: 100,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 5,
    sodiumMilligramsPerServing: 50,
  });
  assert.equal(zero.confidence, "INSUFFICIENT_DATA");

  const negative = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: -14,
    servingUnit: "g",
    caloriesPerServing: 100,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 5,
    sodiumMilligramsPerServing: 50,
  });
  assert.equal(negative.confidence, "INSUFFICIENT_DATA");

  const missingUnit = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 14,
    caloriesPerServing: 100,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 5,
    sodiumMilligramsPerServing: 50,
  });
  assert.equal(missingUnit.confidence, "INSUFFICIENT_DATA");
});

test("wrong serving unit for the category is treated as insufficient data", () => {
  const beverageInGrams = calculateHealthStarRating({
    category: "NON_DAIRY_BEVERAGE",
    servingQuantity: 250,
    servingUnit: "g",
    caloriesPerServing: 50,
    totalSugarsGramsPerServing: 12,
  });
  assert.equal(beverageInGrams.confidence, "INSUFFICIENT_DATA");
});

test("Super Delights Brownie Bites worked example reproduces 0.5 stars", () => {
  const result = calculateHealthStarRating({
    category: "FOOD",
    servingQuantity: 14,
    servingUnit: "g",
    caloriesPerServing: 60,
    saturatedFatGramsPerServing: 1,
    totalSugarsGramsPerServing: 6,
    sodiumMilligramsPerServing: 40,
  });

  assert.equal(result.confidence, "CONSERVATIVE");
  assert.ok(result.standardized);
  assert.equal(Math.round((result.standardized?.energyKilojoules ?? 0) * 100) / 100, 1793.14);
  assert.equal(Math.round((result.standardized?.saturatedFatGrams ?? 0) * 100) / 100, 7.14);
  assert.equal(Math.round((result.standardized?.totalSugarsGrams ?? 0) * 100) / 100, 42.86);
  assert.equal(Math.round((result.standardized?.sodiumMilligrams ?? 0) * 100) / 100, 285.71);

  assert.equal(result.points?.energyPoints, 5);
  assert.equal(result.points?.saturatedFatPoints, 7);
  assert.equal(result.points?.sugarPoints, 10);
  assert.equal(result.points?.sodiumPoints, 3);
  assert.equal(result.points?.baselinePoints, 25);
  assert.equal(result.points?.finalPoints, 25);

  assert.equal(result.starRating, 0.5);
  assert.equal(result.starRatingHalfSteps, 1);
  assert.equal(starRatingFromHalfSteps(result.starRatingHalfSteps as number), 0.5);
});
