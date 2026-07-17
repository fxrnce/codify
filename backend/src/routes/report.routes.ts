import { getAuth } from "@clerk/express";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

export const reportRouter = Router();

const REPORT_REASONS = [
  "No FDA record found",
  "Wrong product information",
  "Suspicious product",
  "Possible counterfeit",
  "Other concern",
] as const;

const reportBodySchema = z.object({
  barcode: z
    .string()
    .trim()
    .regex(/^\d{8,14}$/, {
      message: "Barcode must contain 8 to 14 digits.",
    })
    .nullable()
    .optional(),
  productName: z.string().trim().min(1).max(160),
  brand: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120),
  reason: z.enum(REPORT_REASONS),
  notes: z.string().trim().max(2000).default(""),
});

type DatabaseProductReport = {
  id: string;
  barcode: string | null;
  productName: string;
  brand: string;
  category: string;
  reason: string;
  notes: string;
  submittedAt: Date;
};

function getAuthenticatedClerkUserId(
  request: Request,
  response: Response,
): string | null {
  const auth = getAuth(request);

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
  return prisma.user.upsert({
    where: {
      clerkUserId,
    },

    update: {},

    create: {
      clerkUserId,
    },
  });
}

function mapReportToApi(report: DatabaseProductReport) {
  return {
    id: report.id,
    barcode: report.barcode ?? "",
    productName: report.productName,
    brand: report.brand,
    category: report.category,
    reason: report.reason,
    notes: report.notes,
    submittedAt: report.submittedAt.toISOString(),
  };
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

      const databaseReports = await prisma.productReport.findMany({
        where: {
          userId: databaseUser.id,
        },

        orderBy: {
          submittedAt: "desc",
        },
      });

      const encounteredBarcodes = new Set<string>();
      const reports = [];

      for (const report of databaseReports) {
        const reportKey = report.barcode ?? "no-barcode";

        if (encounteredBarcodes.has(reportKey)) {
          continue;
        }

        encounteredBarcodes.add(reportKey);
        reports.push(mapReportToApi(report));
      }

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
        ? await prisma.product.findUnique({
            where: {
              barcode,
            },

            select: {
              id: true,
            },
          })
        : null;

      const createdReport = await prisma.productReport.create({
        data: {
          userId: databaseUser.id,
          productId: product?.id ?? null,
          barcode,
          productName: parsedBody.data.productName,
          brand: parsedBody.data.brand,
          category: parsedBody.data.category,
          reason: parsedBody.data.reason,
          notes: parsedBody.data.notes,
        },
      });

      response.status(201).json({
        success: true,
        message: "Product report submitted successfully",
        report: mapReportToApi(createdReport),
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

      const deleteResult = await prisma.productReport.deleteMany({
        where: {
          userId: databaseUser.id,
        },
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
