CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "report_status" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
ALTER TABLE "users" ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'USER';
ALTER TABLE "products" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "product_reports"
  ADD COLUMN "status" "report_status" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "resolution_note" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "hidden_by_reporter" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "client_report_id" TEXT;
CREATE UNIQUE INDEX "product_reports_user_id_client_report_id_key" ON "product_reports"("user_id", "client_report_id");
CREATE TABLE "admin_audit_logs" (
  "id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "admin_audit_logs_entity_type_entity_id_created_at_idx" ON "admin_audit_logs"("entity_type", "entity_id", "created_at");
