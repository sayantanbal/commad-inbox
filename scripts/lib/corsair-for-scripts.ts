import { googlecalendar } from "@corsair-dev/googlecalendar";
import { gmail } from "@corsair-dev/gmail";
import { createCorsair } from "corsair";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const CORSAIR_KEK = process.env.CORSAIR_KEK;

if (!DATABASE_URL || !CORSAIR_KEK) {
  throw new Error("DATABASE_URL and CORSAIR_KEK are required");
}

const appUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const pgPool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  ssl: { rejectUnauthorized: false },
});

export const corsair = createCorsair({
  multiTenancy: true,
  database: pgPool,
  kek: CORSAIR_KEK,
  plugins: [gmail(), googlecalendar()],
  connect: {
    baseUrl: appUrl,
    redirectUri: `${appUrl}/api/auth/callback/corsair`,
  },
});

export function getAppUrlFromEnv(): string {
  return appUrl;
}
