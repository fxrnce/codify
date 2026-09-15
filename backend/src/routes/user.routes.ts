import { getAuth } from "@clerk/express";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { prisma } from "../lib/prisma.js";

// Dependency injection permits route tests without a live database or Clerk session.
export function createUserRouter(db = prisma, authenticate = getAuth) {
  const userRouter = Router();

  userRouter.get(
    "/me",
    async (request: Request, response: Response, next: NextFunction) => {
      const auth = authenticate(request);

      if (!auth.isAuthenticated || !auth.userId) {
        response.status(401).json({
          success: false,
          message: "Unauthorized",
        });

        return;
      }

      try {
        const databaseUser = await db.user.upsert({
          where: {
            clerkUserId: auth.userId,
          },

          update: {},

          create: {
            clerkUserId: auth.userId,
          },
        });

        response.status(200).json({
          success: true,
          message: "Authenticated Clerk session",
          user: {
            id: databaseUser.id,
            clerkUserId: databaseUser.clerkUserId,
            role: databaseUser.role,
            sessionId: auth.sessionId,
            createdAt: databaseUser.createdAt,
            updatedAt: databaseUser.updatedAt,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return userRouter;
}

export const userRouter = createUserRouter();
