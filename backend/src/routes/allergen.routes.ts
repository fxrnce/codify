import { getAuth } from "@clerk/express";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";

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
  authenticate: typeof getAuth,
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

// Dependency injection permits route tests without a live database or Clerk session.
export function createAllergenRouter(db = prisma, authenticate = getAuth) {
  const allergenRouter = Router();

  allergenRouter.get(
    "/allergen-preferences",
    async (request: Request, response: Response, next: NextFunction) => {
      const clerkUserId = getAuthenticatedClerkUserId(
        request,
        response,
        authenticate,
      );

      if (!clerkUserId) {
        return;
      }

      try {
        const databaseUser = await db.user.upsert({
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
      const clerkUserId = getAuthenticatedClerkUserId(
        request,
        response,
        authenticate,
      );

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
        const databaseUser = await db.user.upsert({
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

  return allergenRouter;
}

export const allergenRouter = createAllergenRouter();
