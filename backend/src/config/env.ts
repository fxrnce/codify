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

  // Optional: an S3-compatible bucket (Cloudflare R2, Supabase Storage, AWS
  // S3, Backblaze B2, MinIO, ...) for report evidence photos. When any of
  // these are missing, evidence upload/view routes respond with a clear
  // "not configured" error instead of the server failing to start — report
  // text submission never depends on this. See backend/.env.example.
  STORAGE_S3_BUCKET: z.string().min(1).optional(),
  STORAGE_S3_REGION: z.string().min(1).optional(),
  STORAGE_S3_ENDPOINT: z.string().min(1).optional(),
  STORAGE_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_S3_FORCE_PATH_STYLE: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid backend environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;
