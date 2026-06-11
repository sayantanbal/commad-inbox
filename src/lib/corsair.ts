import { googlecalendar } from "@corsair-dev/googlecalendar";
import { gmail } from "@corsair-dev/gmail";
import { createCorsair } from "corsair";
import { env, getAppUrl } from "@/lib/env";
import { pgPool } from "@/lib/db/pool";

const appUrl = getAppUrl();

export const corsair = createCorsair({
  multiTenancy: true,
  database: pgPool,
  kek: env.CORSAIR_KEK,
  plugins: [gmail(), googlecalendar()],
  connect: {
    baseUrl: appUrl,
    redirectUri: `${appUrl}/api/auth/callback/corsair`,
  },
});

export type CorsairInstance = typeof corsair;
