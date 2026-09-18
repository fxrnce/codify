-- Adds structured, reproducible Health Star Rating (HSR) nutrition rating
-- storage. This migration is purely additive: it does not touch the
-- existing `products.health_score` column, so no production data is lost.
-- A follow-up migration drops `health_score` only after the backfill script
-- (backend/src/scripts/backfill-nutrition-ratings.ts) has safely populated
-- `nutrition_ratings` for every eligible existing product.

-- CreateEnum
CREATE TYPE "hsr_category" AS ENUM (
  'NON_DAIRY_BEVERAGE',
  'DAIRY_BEVERAGE',
  'FOOD',
  'DAIRY_FOOD',
  'FATS_OILS_SPREADS',
  'CHEESE',
  'PLAIN_WATER',
  'UNSWEETENED_FLAVOURED_WATER'
);

-- CreateEnum
CREATE TYPE "hsr_confidence" AS ENUM (
  'COMPLETE',
  'CONSERVATIVE',
  'INSUFFICIENT_DATA'
);

-- CreateTable
CREATE TABLE "nutrition_ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "category" "hsr_category" NOT NULL,
    "confidence" "hsr_confidence" NOT NULL,
    "method_version" TEXT NOT NULL,
    "reason" TEXT,

    "serving_quantity" DOUBLE PRECISION,
    "serving_unit" TEXT,
    "calories_per_serving" DOUBLE PRECISION,
    "saturated_fat_grams_per_serving" DOUBLE PRECISION,
    "total_sugars_grams_per_serving" DOUBLE PRECISION,
    "sodium_milligrams_per_serving" DOUBLE PRECISION,
    "protein_grams_per_serving" DOUBLE PRECISION,
    "fibre_grams_per_serving" DOUBLE PRECISION,
    "fvnl_percent" DOUBLE PRECISION,
    "contains_fruit_or_vegetable" BOOLEAN NOT NULL DEFAULT false,
    "contains_nuts_or_legumes" BOOLEAN NOT NULL DEFAULT false,

    "energyKilojoulesPer100" DOUBLE PRECISION,
    "saturatedFatGramsPer100" DOUBLE PRECISION,
    "totalSugarsGramsPer100" DOUBLE PRECISION,
    "sodiumMilligramsPer100" DOUBLE PRECISION,
    "proteinGramsPer100" DOUBLE PRECISION,
    "fibreGramsPer100" DOUBLE PRECISION,

    "baseline_points" INTEGER,
    "protein_points" INTEGER,
    "fibre_points" INTEGER,
    "fvnl_points" INTEGER,
    "final_points" INTEGER,
    "protein_points_withheld_by_rule" BOOLEAN NOT NULL DEFAULT false,
    "unavailable_components" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    "star_rating_half_steps" INTEGER,

    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_ratings_product_id_key" ON "nutrition_ratings"("product_id");

-- AddForeignKey
ALTER TABLE "nutrition_ratings" ADD CONSTRAINT "nutrition_ratings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
