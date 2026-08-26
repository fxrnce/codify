CREATE TYPE "advisory_category" AS ENUM ('FOOD', 'DRUG', 'COSMETIC');

CREATE TYPE "advisory_type" AS ENUM (
  'PUBLIC_HEALTH_WARNING',
  'RECALL',
  'QUALITY_HOLD',
  'SAFETY_ALERT',
  'LIFTING'
);

CREATE TYPE "advisory_status" AS ENUM ('NOT_APPROVED', 'CAUTION', 'LIFTED');

CREATE TABLE "fda_advisories" (
  "id" UUID NOT NULL,
  "advisory_number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "advisory_category" NOT NULL,
  "type" "advisory_type" NOT NULL,
  "status" "advisory_status" NOT NULL,
  "published_at" DATE NOT NULL,
  "source_url" TEXT NOT NULL,
  "filipino_source_url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fda_advisories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fda_advisories_advisory_number_key"
ON "fda_advisories"("advisory_number");

CREATE INDEX "fda_advisories_published_at_idx"
ON "fda_advisories"("published_at");

CREATE INDEX "fda_advisories_category_published_at_idx"
ON "fda_advisories"("category", "published_at");

CREATE INDEX "fda_advisories_status_published_at_idx"
ON "fda_advisories"("status", "published_at");
