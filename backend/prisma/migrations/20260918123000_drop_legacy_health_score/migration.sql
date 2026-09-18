-- Drops the old, misleading `health_score` integer column now that every
-- product that had a non-null value has been recalculated into a structured,
-- reproducible `nutrition_ratings` row by the HSR-based estimator (see
-- backend/src/lib/nutrition-score.ts and prisma/seed.ts). Verified via
-- backend/scripts/nutrition-audit-report.mjs before this migration was
-- written: all 46 previously non-null health_score rows produced an
-- equivalent nutrition_ratings row (3 COMPLETE for plain water, 43
-- CONSERVATIVE), so no rating information is lost.
ALTER TABLE "products" DROP COLUMN "health_score";
