import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  // Neon (and similar serverless Postgres) closes idle connections after a
  // period of inactivity, which the pool only discovers when it tries to
  // reuse one, surfacing as "Connection terminated unexpectedly" on the
  // next query. Recycling idle connections proactively (before Neon does)
  // and keeping TCP alive avoids that class of failure on a long-lived
  // process such as this backend.
  idleTimeoutMillis: 30_000,
  keepAlive: true,
});

export const prisma = new PrismaClient({
  adapter,
});
