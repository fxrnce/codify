-- CreateTable
CREATE TABLE "product_reports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "barcode" TEXT,
    "product_name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_reports_user_id_submitted_at_idx" ON "product_reports"("user_id", "submitted_at");

-- CreateIndex
CREATE INDEX "product_reports_product_id_idx" ON "product_reports"("product_id");

-- CreateIndex
CREATE INDEX "product_reports_barcode_idx" ON "product_reports"("barcode");

-- AddForeignKey
ALTER TABLE "product_reports" ADD CONSTRAINT "product_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reports" ADD CONSTRAINT "product_reports_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
