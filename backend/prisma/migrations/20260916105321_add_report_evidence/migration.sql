-- CreateTable
CREATE TABLE "report_evidence" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_cleanup_tasks" (
    "id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_cleanup_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_evidence_report_id_idx" ON "report_evidence"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_evidence_report_id_position_key" ON "report_evidence"("report_id", "position");

-- AddForeignKey
ALTER TABLE "report_evidence" ADD CONSTRAINT "report_evidence_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "product_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
