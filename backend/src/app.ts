import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { env } from "./config/env.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  clerkMiddleware({
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.get("/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Codify backend is running",
    service: "codify-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", userRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error("Unhandled backend error:", error);

    response.status(500).json({
      success: false,
      message: "Internal server error",
    });
  },
);
