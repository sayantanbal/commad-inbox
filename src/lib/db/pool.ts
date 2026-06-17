import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { env } from "@/lib/env";

const globalForPool = globalThis as unknown as { pgPool: Pool | undefined };

export const pgPool: Pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: process.env.VERCEL ? 5 : 10,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.VERCEL) {
  attachDatabasePool(pgPool);
}

pgPool.on("connect", (client) => {
  void client.query("SET statement_timeout = '30s'");
});

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pgPool;
}
