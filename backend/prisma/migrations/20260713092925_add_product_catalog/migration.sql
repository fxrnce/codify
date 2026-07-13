-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('APPROVED', 'CAUTION', 'NOT_APPROVED');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "product_status" NOT NULL,
    "fda_status_label" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "health_score" INTEGER NOT NULL,
    "serving_size" TEXT NOT NULL,
    "warning_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_facts" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "calories" TEXT NOT NULL,
    "protein" TEXT NOT NULL,
    "carbohydrates" TEXT NOT NULL,
    "total_fat" TEXT NOT NULL,
    "sodium" TEXT NOT NULL,

    CONSTRAINT "nutrition_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_allergen" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_allergens" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_alternatives" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "barcode" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_facts_product_id_key" ON "nutrition_facts"("product_id");

-- CreateIndex
CREATE INDEX "product_ingredients_product_id_idx" ON "product_ingredients"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_product_id_position_key" ON "product_ingredients"("product_id", "position");

-- CreateIndex
CREATE INDEX "product_allergens_product_id_idx" ON "product_allergens"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_allergens_product_id_name_key" ON "product_allergens"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_allergens_product_id_position_key" ON "product_allergens"("product_id", "position");

-- CreateIndex
CREATE INDEX "product_alternatives_product_id_idx" ON "product_alternatives"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_alternatives_product_id_name_key" ON "product_alternatives"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_alternatives_product_id_position_key" ON "product_alternatives"("product_id", "position");

-- CreateIndex
CREATE INDEX "scans_user_id_scanned_at_idx" ON "scans"("user_id", "scanned_at");

-- CreateIndex
CREATE INDEX "scans_product_id_idx" ON "scans"("product_id");

-- CreateIndex
CREATE INDEX "scans_barcode_idx" ON "scans"("barcode");

-- AddForeignKey
ALTER TABLE "nutrition_facts" ADD CONSTRAINT "nutrition_facts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_allergens" ADD CONSTRAINT "product_allergens_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_alternatives" ADD CONSTRAINT "product_alternatives_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
