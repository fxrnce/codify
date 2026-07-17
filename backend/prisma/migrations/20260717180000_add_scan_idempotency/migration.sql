-- AlterTable
ALTER TABLE "scans" ADD COLUMN "client_scan_id" TEXT;

-- Backfill existing scans with their database IDs.
UPDATE "scans" SET "client_scan_id" = "id"::TEXT;

-- AlterTable
ALTER TABLE "scans" ALTER COLUMN "client_scan_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "scans_user_id_client_scan_id_key" ON "scans"("user_id", "client_scan_id");
