-- AlterTable
ALTER TABLE "users"
ADD COLUMN "allergen_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
