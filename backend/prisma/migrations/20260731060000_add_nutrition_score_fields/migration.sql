-- Add the verified nutrients used to explain nutrition-score estimates.
ALTER TABLE "nutrition_facts"
ADD COLUMN "saturated_fat" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN "total_sugars" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN "dietary_fiber" TEXT NOT NULL DEFAULT 'N/A';
