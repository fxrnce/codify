import { randomUUID } from "node:crypto";

import { getAuth } from "@clerk/express";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

export const scanRouter = Router();

type DatabaseProductStatus = "APPROVED" | "CAUTION" | "NOT_APPROVED";

type ScanWithProduct = {
  id: string;
  clientScanId: string;
  barcode: string;
  scannedAt: Date;

  product: {
    name: string;
    brand: string;
    category: string;
    status: DatabaseProductStatus;
    fdaStatusLabel: string;
  } | null;
};

const scanBodySchema = z
  .object({
    barcode: z
      .string()
      .trim()
      .regex(/^\d{8,14}$/, {
        message: "Barcode must contain 8 to 14 digits.",
      }),
    clientScanId: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    scannedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

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

function getProductStatusLabel(status: DatabaseProductStatus) {
  if (status === "APPROVED") {
    return "Approved" as const;
  }

  if (status === "CAUTION") {
    return "Caution" as const;
  }

  return "Not Approved" as const;
}

function mapScanToHistoryItem(scan: ScanWithProduct) {
  if (!scan.product) {
    return {
      id: scan.id,
      clientScanId: scan.clientScanId,
      barcode: scan.barcode,
      name: "Unknown Product",
      brand: "No FDA record found",
      category: "Unverified Product",
      status: "Not Approved" as const,
      fdaStatusLabel: "Not Listed / Unverified",
      scannedAt: scan.scannedAt.toISOString(),
    };
  }

  return {
    id: scan.id,
    clientScanId: scan.clientScanId,
    barcode: scan.barcode,
    name: scan.product.name,
    brand: scan.product.brand,
    category: scan.product.category,
    status: getProductStatusLabel(scan.product.status),
    fdaStatusLabel: scan.product.fdaStatusLabel,
    scannedAt: scan.scannedAt.toISOString(),
  };
}

scanRouter.get(
  "/scans",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    try {
      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);

      const databaseScans = await prisma.scan.findMany({
        where: {
          userId: databaseUser.id,
        },

        orderBy: {
          scannedAt: "desc",
        },

        include: {
          product: {
            select: {
              name: true,
              brand: true,
              category: true,
              status: true,
              fdaStatusLabel: true,
            },
          },
        },
      });

      const encounteredBarcodes = new Set<string>();
      const scanHistory = [];

      for (const scan of databaseScans) {
        if (encounteredBarcodes.has(scan.barcode)) {
          continue;
        }

        encounteredBarcodes.add(scan.barcode);
        scanHistory.push(mapScanToHistoryItem(scan));
      }

      response.status(200).json({
        success: true,
        scans: scanHistory,
      });
    } catch (error) {
      next(error);
    }
  },
);

scanRouter.post(
  "/scans",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    const parsedBody = scanBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({
        success: false,
        message: "Invalid barcode. Barcode must contain 8 to 14 digits.",
      });

      return;
    }

    try {
      const barcode = parsedBody.data.barcode;
      const clientScanId = parsedBody.data.clientScanId ?? randomUUID();
      const scannedAt = parsedBody.data.scannedAt
        ? new Date(parsedBody.data.scannedAt)
        : new Date();

      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);

      const product = await prisma.product.findUnique({
        where: {
          barcode,
        },

        select: {
          id: true,
        },
      });

      const savedScan = await prisma.scan.upsert({
        where: {
          userId_clientScanId: {
            userId: databaseUser.id,
            clientScanId,
          },
        },

        update: {},

        create: {
          userId: databaseUser.id,
          productId: product?.id ?? null,
          clientScanId,
          barcode,
          scannedAt,
        },

        include: {
          product: {
            select: {
              name: true,
              brand: true,
              category: true,
              status: true,
              fdaStatusLabel: true,
            },
          },
        },
      });

      response.status(201).json({
        success: true,
        message: "Scan saved successfully",
        scan: mapScanToHistoryItem(savedScan),
      });
    } catch (error) {
      next(error);
    }
  },
);

scanRouter.delete(
  "/scans",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    try {
      const databaseUser = await getOrCreateDatabaseUser(clerkUserId);

      const deleteResult = await prisma.scan.deleteMany({
        where: {
          userId: databaseUser.id,
        },
      });

      response.status(200).json({
        success: true,
        message: "Scan history cleared successfully",
        deletedCount: deleteResult.count,
      });
    } catch (error) {
      next(error);
    }
  },
);
