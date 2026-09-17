import { randomUUID } from "node:crypto";

import { getAuth } from "@clerk/express";
import multer from "multer";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import {
  MAX_EVIDENCE_FILES,
  MAX_EVIDENCE_FILE_BYTES,
  validateEvidenceFiles,
} from "../lib/image-validation.js";
import { prisma } from "../lib/prisma.js";
import { productCodeSchema } from "../lib/product-code.js";
import { getObjectStorage, type ObjectStorage } from "../lib/storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_EVIDENCE_FILE_BYTES,
    files: MAX_EVIDENCE_FILES,
  },
});

export function createReportRouter(
  db = prisma,
  authenticate = getAuth,
  storage: ObjectStorage | null = getObjectStorage(),
) {
const reportRouter = Router();

const REPORT_REASONS = [
  "No FDA record found",
  "Wrong product information",
  "Suspicious product",
  "Possible counterfeit",
  "Other concern",
] as const;

const reportBodySchema = z.object({
  barcode: productCodeSchema.nullable().optional(),
  productName: z.string().trim().min(1).max(160),
  brand: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120),
  reason: z.enum(REPORT_REASONS),
  notes: z.string().trim().max(2000).default(""),
  clientReportId: z.string().trim().min(1).max(128).optional(),
});

const reportIdSchema = z.uuid();

type DatabaseProductReport = {
  id: string;
  barcode: string | null;
  productName: string;
  brand: string;
  category: string;
  reason: string;
  notes: string;
  submittedAt: Date;
  status: string;
  resolutionNote: string;
  reviewedAt: Date | null;
  updatedAt: Date;
  clientReportId: string | null;
};

type DatabaseReportEvidence = {
  id: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  position: number;
  createdAt: Date;
};

function getAuthenticatedClerkUserId(
  request: Request,
  response: Response,
): string | null {
  const auth = authenticate(request);

  if (!auth.isAuthenticated || !auth.userId) {
    response.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return auth.userId;
}

async function getOrCreateDatabaseUser(clerkUserId: string) {
  return db.user.upsert({
    where: {
      clerkUserId,
    },

    update: {},

    create: {
      clerkUserId,
    },
  });
}

async function mapEvidenceToApi(rows: DatabaseReportEvidence[]) {
  const sortedRows = [...rows].sort((a, b) => a.position - b.position);

  return Promise.all(
    sortedRows.map(async (row) => ({
      id: row.id,
      url: storage ? await storage.getSignedGetUrl(row.storageKey) : null,
      mimeType: row.mimeType,
      byteSize: row.byteSize,
      width: row.width,
      height: row.height,
      position: row.position,
      createdAt: row.createdAt.toISOString(),
    })),
  );
}

async function mapReportToApi(
  report: DatabaseProductReport,
  evidenceRows: DatabaseReportEvidence[] = [],
) {
  return {
    id: report.id,
    barcode: report.barcode ?? "",
    productName: report.productName,
    brand: report.brand,
    category: report.category,
    reason: report.reason,
    notes: report.notes,
    submittedAt: report.submittedAt.toISOString(),
    status: report.status,
    resolutionNote: report.resolutionNote,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    updatedAt: report.updatedAt.toISOString(),
    clientReportId: report.clientReportId,
    evidence: await mapEvidenceToApi(evidenceRows),
  };
}

async function recordCleanupFailure(storageKey: string, reason: string) {
  try {
    await db.storageCleanupTask.create({
      data: { storageKey, reason },
    });
  } catch (error) {
    // The cleanup task table is itself best-effort bookkeeping; if even
    // that write fails, there is nothing left to do but log it.
    console.error(
      "Failed to record a storage cleanup task:",
      storageKey,
      error,
    );
  }
}

reportRouter.get(
  "/reports",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    try {
      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);

      const databaseReports = await db.productReport.findMany({
        where: {
          userId: databaseUser.id,
          hiddenByReporter: false,
        },

        orderBy: {
          submittedAt: "desc",
        },

        include: {
          evidence: { orderBy: { position: "asc" } },
        },
      });

      const reports = await Promise.all(
        databaseReports.map((report) =>
          mapReportToApi(report, report.evidence),
        ),
      );

      response.status(200).json({
        success: true,
        reports,
      });
    } catch (error) {
      next(error);
    }
  },
);

reportRouter.post(
  "/reports",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    const parsedBody = reportBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({
        success: false,
        message: "Invalid product report details.",
      });

      return;
    }

    try {
      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);
      const barcode = parsedBody.data.barcode ?? null;

      const product = barcode
        ? await db.product.findUnique({
            where: {
              barcode,
            },

            select: {
              id: true,
            },
          })
        : null;

      const data = {
          userId: databaseUser.id,
          productId: product?.id ?? null,
          barcode,
          productName: parsedBody.data.productName,
          brand: parsedBody.data.brand,
          category: parsedBody.data.category,
          reason: parsedBody.data.reason,
          notes: parsedBody.data.notes,
          clientReportId: parsedBody.data.clientReportId,
      };
      // Retrying a queued report must not create another report in the admin inbox.
      const createdReport = data.clientReportId
        ? await db.productReport.upsert({
            where: { userId_clientReportId: { userId: databaseUser.id, clientReportId: data.clientReportId } },
            update: {}, create: data,
          })
        : await db.productReport.create({ data });

      response.status(201).json({
        success: true,
        message: "Product report submitted successfully",
        report: await mapReportToApi(createdReport, []),
      });
    } catch (error) {
      next(error);
    }
  },
);

// Evidence is uploaded as a follow-up request once the report row exists
// (created above, possibly minutes or days earlier if the report was queued
// offline). PUT replaces the report's whole evidence set in one call, which
// makes a retried upload after a dropped connection naturally idempotent:
// replaying the same request converges on the same end state instead of
// appending duplicates.
reportRouter.put(
  "/reports/:id/evidence",
  (request: Request, response: Response, next: NextFunction) => {
    upload.array("images", MAX_EVIDENCE_FILES)(request, response, (error) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? `Each photo must be ${Math.floor(MAX_EVIDENCE_FILE_BYTES / (1024 * 1024))}MB or smaller.`
            : error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
              ? `You can attach up to ${MAX_EVIDENCE_FILES} photos.`
              : "The photos could not be uploaded.";

        response.status(400).json({ success: false, message });
        return;
      }

      next(error);
    });
  },
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    const parsedId = reportIdSchema.safeParse(request.params.id);

    if (!parsedId.success) {
      response.status(400).json({
        success: false,
        message: "Invalid report id.",
      });

      return;
    }

    try {
      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);
      const report = await db.productReport.findUnique({
        where: { id: parsedId.data },
      });

      // 404 (not 403) for a report that belongs to someone else, so a
      // non-owner cannot even learn that the report id exists.
      if (!report || report.userId !== databaseUser.id) {
        response.status(404).json({
          success: false,
          message: "Report not found.",
        });

        return;
      }

      const files = (request.files as Express.Multer.File[] | undefined) ?? [];

      const validation = await validateEvidenceFiles(
        files.map((file) => ({ buffer: file.buffer })),
      );

      if (!validation.ok) {
        response.status(400).json({
          success: false,
          message: "One or more photos are not a supported image type.",
          errors: validation.errors,
        });

        return;
      }

      if (!storage) {
        response.status(503).json({
          success: false,
          message:
            "Photo evidence storage is not configured on this server yet.",
        });

        return;
      }

      const uploaded: {
        key: string;
        mimeType: string;
        byteSize: number;
        position: number;
      }[] = [];

      try {
        for (const file of validation.files) {
          const key = `report-evidence/${report.id}/${randomUUID()}.${file.extension}`;

          await storage.putObject(key, file.buffer, file.mimeType);

          uploaded.push({
            key,
            mimeType: file.mimeType,
            byteSize: file.byteSize,
            position: file.index,
          });
        }
      } catch (uploadError) {
        // Nothing in the database has changed yet, so this is fully
        // retryable and the report text is untouched. Best-effort clean up
        // whatever partial uploads did succeed before surfacing the error.
        await Promise.allSettled(
          uploaded.map((item) => storage!.deleteObject(item.key)),
        );

        next(uploadError);
        return;
      }

      const previousEvidence = await db.reportEvidence.findMany({
        where: { reportId: report.id },
      });

      await db.$transaction(async (tx) => {
        await tx.reportEvidence.deleteMany({ where: { reportId: report.id } });

        if (uploaded.length > 0) {
          await tx.reportEvidence.createMany({
            data: uploaded.map((item) => ({
              reportId: report.id,
              storageKey: item.key,
              mimeType: item.mimeType,
              byteSize: item.byteSize,
              position: item.position,
            })),
          });
        }
      });

      // The database row is already the source of truth for what evidence
      // exists; deleting the replaced objects is best-effort cleanup, not a
      // correctness requirement.
      await Promise.allSettled(
        previousEvidence.map(async (previous) => {
          try {
            await storage!.deleteObject(previous.storageKey);
          } catch {
            await recordCleanupFailure(previous.storageKey, "replaced-evidence");
          }
        }),
      );

      const evidenceRows = await db.reportEvidence.findMany({
        where: { reportId: report.id },
        orderBy: { position: "asc" },
      });

      response.json({
        success: true,
        report: await mapReportToApi(report, evidenceRows),
      });
    } catch (error) {
      next(error);
    }
  },
);

reportRouter.delete(
  "/reports",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    try {
      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);

      // Clearing personal history must not remove a report from the admin inbox.
      const deleteResult = await db.productReport.updateMany({
        where: {
          userId: databaseUser.id,
        },
        data: { hiddenByReporter: true },
      });

      response.status(200).json({
        success: true,
        message: "Product reports cleared successfully",
        deletedCount: deleteResult.count,
      });
    } catch (error) {
      next(error);
    }
  },
);

return reportRouter;
}
export const reportRouter = createReportRouter();
