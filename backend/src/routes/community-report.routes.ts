import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { equivalentBarcode } from "../lib/admin-validation.js";
import { prisma } from "../lib/prisma.js";
import { productCodeSchema } from "../lib/product-code.js";

const communityReportQuerySchema = z.object({
  barcode: productCodeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const communityReportIdSchema = z.uuid();

// Only reports an admin resolved and explicitly published are public.
const publicWhere = { isPublic: true, status: "RESOLVED" } as const;

// An explicit allow-list: the reporter's identity, photo evidence, and admin
// bookkeeping fields must never leave this endpoint.
const communityReportSelect = {
  id: true,
  barcode: true,
  productName: true,
  brand: true,
  category: true,
  reason: true,
  notes: true,
  resolutionNote: true,
  submittedAt: true,
  reviewedAt: true,
} as const;

type CommunityReportRow = {
  id: string;
  barcode: string | null;
  productName: string;
  brand: string;
  category: string;
  reason: string;
  notes: string;
  resolutionNote: string;
  submittedAt: Date;
  reviewedAt: Date | null;
};

function serializeCommunityReport(report: CommunityReportRow) {
  return {
    id: report.id,
    barcode: report.barcode,
    productName: report.productName,
    brand: report.brand,
    category: report.category,
    reason: report.reason,
    notes: report.notes,
    response: report.resolutionNote,
    submittedAt: report.submittedAt.toISOString(),
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
  };
}

// Dependency injection permits route tests without a live database.
export function createCommunityReportRouter(db = prisma) {
  const communityReportRouter = Router();

  communityReportRouter.get(
    "/community-reports",
    async (request: Request, response: Response, next: NextFunction) => {
      const parsedQuery = communityReportQuerySchema.safeParse(request.query);

      if (!parsedQuery.success) {
        response.status(400).json({
          success: false,
          message: "Invalid community report filters.",
        });

        return;
      }

      const { barcode, page, limit } = parsedQuery.data;
      // A product page may be opened with either the UPC-A or EAN-13 form
      // of the same code, and a report may have been filed with either.
      const barcodes = barcode
        ? Array.from(new Set([barcode, equivalentBarcode(barcode)]))
        : [];
      const where = barcode
        ? {
            ...publicWhere,
            OR: [
              { barcode: { in: barcodes } },
              { product: { barcode: { in: barcodes } } },
            ],
          }
        : publicWhere;

      try {
        const [reports, total] = await Promise.all([
          db.productReport.findMany({
            where,
            select: communityReportSelect,
            orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.productReport.count({ where }),
        ]);

        response.status(200).json({
          success: true,
          reports: reports.map(serializeCommunityReport),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  communityReportRouter.get(
    "/community-reports/:id",
    async (request: Request, response: Response, next: NextFunction) => {
      const parsedId = communityReportIdSchema.safeParse(request.params.id);

      if (!parsedId.success) {
        response.status(400).json({
          success: false,
          message: "Invalid community report id.",
        });

        return;
      }

      try {
        // findFirst with the public filter, so a private report's id
        // returns the same 404 as an id that does not exist.
        const report = await db.productReport.findFirst({
          where: { id: parsedId.data, ...publicWhere },
          select: communityReportSelect,
        });

        if (!report) {
          response.status(404).json({
            success: false,
            message: "Community report not found.",
          });

          return;
        }

        response.status(200).json({
          success: true,
          report: serializeCommunityReport(report),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return communityReportRouter;
}

export const communityReportRouter = createCommunityReportRouter();
