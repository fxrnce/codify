-- Add a distinct status for products whose exact barcode or market variant
-- cannot be matched to a Philippine FDA record.
ALTER TYPE "product_status" ADD VALUE 'UNVERIFIED';

-- Do not invent a health score when the package does not provide enough
-- nutrition information for a defensible calculation.
ALTER TABLE "products" ALTER COLUMN "health_score" DROP NOT NULL;
