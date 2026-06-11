import { Pool } from "pg";
import { env } from "@/lib/env";

const globalForPool = globalThis as unknown as { pgPool: Pool | undefined };

export const pgPool: Pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pgPool;
}
