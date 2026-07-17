import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { env } from "./config/env.js";
import { allergenRouter } from "./routes/allergen.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { reportRouter } from "./routes/report.routes.js";
import { scanRouter } from "./routes/scan.routes.js";
import { userRouter } from "./routes/user.routes.js";

export const app = express();

app.disable("x-powered-by");

/*
 * Clerk must run before every other middleware and route.
 * It attaches authentication information to the request.
 */
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

/*
 * Public product routes.
 * Authentication information is available, but sign-in is not required.
 */
app.use("/api", productRouter);

/*
 * Protected Clerk-authenticated routes.
 */
app.use("/api", allergenRouter);
app.use("/api", userRouter);
app.use("/api", scanRouter);
app.use("/api", reportRouter);

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
