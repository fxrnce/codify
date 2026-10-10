-- Broad product type used by the mobile Search screen's type filter.
-- Existing rows are temporarily backfilled as FOOD so the column can be NOT
-- NULL; prisma/seed.ts then sets the correct type for every curated product.
-- The default is dropped afterwards so new products must choose a type.
CREATE TYPE "product_type" AS ENUM ('FOOD', 'DRINK', 'MEDICINE', 'PERSONAL_CARE', 'HOUSEHOLD');

ALTER TABLE "products" ADD COLUMN "product_type" "product_type" NOT NULL DEFAULT 'FOOD';
ALTER TABLE "products" ALTER COLUMN "product_type" DROP DEFAULT;

CREATE INDEX "products_product_type_idx" ON "products"("product_type");
