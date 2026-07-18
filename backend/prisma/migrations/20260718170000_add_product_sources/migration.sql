-- Store optional product imagery and the official page used to verify status.
ALTER TABLE "products"
ADD COLUMN "image_url" TEXT,
ADD COLUMN "verification_url" TEXT;
