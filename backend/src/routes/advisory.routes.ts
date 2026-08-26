import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

export const advisoryRouter = Router();

const UPDATED_THROUGH = "2026-08-07";

const advisoryQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.enum(["FOOD", "DRUG", "COSMETIC"]).optional(),
  status: z.enum(["NOT_APPROVED", "CAUTION", "LIFTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const advisoryParamsSchema = z.object({
  advisoryNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^\d{4}-\d{3,4}(?:-[A-Z])?$/),
});

const advisorySelect = {
  advisoryNumber: true,
  title: true,
  category: true,
  type: true,
  status: true,
  publishedAt: true,
  sourceUrl: true,
  filipinoSourceUrl: true,
  isActive: true,
} as const;

const categoryLabels = {
  FOOD: "Food",
  DRUG: "Drug",
  COSMETIC: "Cosmetic",
} as const;

const typeLabels = {
  PUBLIC_HEALTH_WARNING: "Public Health Warning",
  RECALL: "Product Recall",
  QUALITY_HOLD: "Quality Hold",
  SAFETY_ALERT: "Safety Alert",
  LIFTING: "Lifting Notice",
} as const;

const statusLabels = {
  NOT_APPROVED: "Not Approved",
  CAUTION: "Caution",
  LIFTED: "Lifted",
} as const;

type AdvisoryRow = {
  advisoryNumber: string;
  title: string;
  category: keyof typeof categoryLabels;
  type: keyof typeof typeLabels;
  status: keyof typeof statusLabels;
  publishedAt: Date;
  sourceUrl: string;
  filipinoSourceUrl: string | null;
  isActive: boolean;
};

function serializeAdvisory(advisory: AdvisoryRow) {
  return {
    advisoryNumber: advisory.advisoryNumber,
    title: advisory.title,
    category: advisory.category,
    categoryLabel: categoryLabels[advisory.category],
    type: advisory.type,
    typeLabel: typeLabels[advisory.type],
    status: advisory.status,
    statusLabel: statusLabels[advisory.status],
    publishedAt: advisory.publishedAt.toISOString().slice(0, 10),
    sourceUrl: advisory.sourceUrl,
    filipinoSourceUrl: advisory.filipinoSourceUrl,
    isActive: advisory.isActive,
  };
}

advisoryRouter.get(
  "/advisories",
  async (request: Request, response: Response, next: NextFunction) => {
    const parsedQuery = advisoryQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({
        success: false,
        message: "Invalid FDA advisory search filters.",
        errors: parsedQuery.error.flatten().fieldErrors,
      });

      return;
    }

    const { q, category, status, page, limit } = parsedQuery.data;
    const searchTerm = q?.trim();
    const where = {
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(searchTerm
        ? {
            OR: [
              {
                advisoryNumber: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
              {
                title: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    try {
      // The advisory catalog changes only when a new dataset is seeded, so the
      // list and count do not need transactional consistency. Keeping these
      // reads sequential also avoids holding a transaction connection while a
      // free hosted database is waking up or its small pool is briefly busy.
      const advisories = await prisma.fdaAdvisory.findMany({
        where,
        orderBy: [
          {
            publishedAt: "desc",
          },
          {
            advisoryNumber: "desc",
          },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: advisorySelect,
      });
      const total = await prisma.fdaAdvisory.count({ where });

      response.status(200).json({
        success: true,
        updatedThrough: UPDATED_THROUGH,
        advisories: advisories.map(serializeAdvisory),
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

advisoryRouter.get(
  "/advisories/:advisoryNumber",
  async (request: Request, response: Response, next: NextFunction) => {
    const parsedParams = advisoryParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      response.status(400).json({
        success: false,
        message: "Invalid FDA advisory number.",
      });

      return;
    }

    try {
      const advisory = await prisma.fdaAdvisory.findUnique({
        where: {
          advisoryNumber: parsedParams.data.advisoryNumber,
        },
        select: advisorySelect,
      });

      if (!advisory) {
        response.status(404).json({
          success: false,
          message: "FDA advisory not found.",
        });

        return;
      }

      response.status(200).json({
        success: true,
        updatedThrough: UPDATED_THROUGH,
        advisory: serializeAdvisory(advisory),
      });
    } catch (error) {
      next(error);
    }
  },
);
