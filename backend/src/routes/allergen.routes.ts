import { getAuth } from "@clerk/express";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

export const allergenRouter = Router();

const allergenIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const allergenPreferencesBodySchema = z
  .object({
    allergenIds: z
      .array(allergenIdSchema)
      .max(50)
      .transform((allergenIds) => [...new Set(allergenIds)]),
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

allergenRouter.get(
  "/allergen-preferences",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    try {
      const databaseUser = await prisma.user.upsert({
        where: {
          clerkUserId,
        },

        update: {},

        create: {
          clerkUserId,
        },
      });

      response.status(200).json({
        success: true,
        allergenIds: databaseUser.allergenIds,
      });
    } catch (error) {
      next(error);
    }
  },
);

allergenRouter.put(
  "/allergen-preferences",
  async (request: Request, response: Response, next: NextFunction) => {
    const clerkUserId = getAuthenticatedClerkUserId(request, response);

    if (!clerkUserId) {
      return;
    }

    const parsedBody = allergenPreferencesBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      response.status(400).json({
        success: false,
        message: "Invalid allergen preferences.",
      });

      return;
    }

    try {
      const databaseUser = await prisma.user.upsert({
        where: {
          clerkUserId,
        },

        update: {
          allergenIds: parsedBody.data.allergenIds,
        },

        create: {
          clerkUserId,
          allergenIds: parsedBody.data.allergenIds,
        },
      });

      response.status(200).json({
        success: true,
        message: "Allergen preferences updated successfully",
        allergenIds: databaseUser.allergenIds,
      });
    } catch (error) {
      next(error);
    }
  },
);
