import { getAuth } from "@clerk/express";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { productCodeSchema } from "../lib/product-code.js";

export function createReportRouter(db = prisma, authenticate = getAuth) {
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
    status: report.status,
    resolutionNote: report.resolutionNote,
    reviewedAt: report.reviewedAt?.toISOString() ?? null,
    updatedAt: report.updatedAt.toISOString(),
    clientReportId: report.clientReportId,
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

      const databaseReports = await db.productReport.findMany({
        where: {
          userId: databaseUser.id,
          hiddenByReporter: false,
        },

        orderBy: {
          submittedAt: "desc",
        },
      });

      const reports = databaseReports.map(mapReportToApi);

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
