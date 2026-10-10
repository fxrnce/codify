-- Admin-controlled flag for showing a reviewed report in the app's public
-- Community Reports list. Existing reports stay private (false) until an
-- admin publishes them individually.
ALTER TABLE "product_reports" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "product_reports_is_public_status_reviewed_at_idx" ON "product_reports"("is_public", "status", "reviewed_at");
