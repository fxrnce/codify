import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  CORS_ORIGIN: z.string().min(1).default("*"),

  CLERK_PUBLISHABLE_KEY: z.string().min(1, {
    message: "CLERK_PUBLISHABLE_KEY is required",
  }),

  CLERK_SECRET_KEY: z.string().min(1, {
    message: "CLERK_SECRET_KEY is required",
  }),

  DATABASE_URL: z.string().min(1, {
    message: "DATABASE_URL is required",
  }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid backend environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;
