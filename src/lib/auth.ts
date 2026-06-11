import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { syncAppUser } from "@/lib/auth/sync-user";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { authUser } from "@/lib/db/schema";
import { assertPhase1Env, env } from "@/lib/env";

assertPhase1Env();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET!,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL, env.APP_URL ?? env.BETTER_AUTH_URL],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [nextCookies()],
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const [user] = await db
            .select()
            .from(authUser)
            .where(eq(authUser.id, session.userId))
            .limit(1);
          if (user) {
            await syncAppUser({
              id: user.id,
              email: user.email,
              name: user.name,
            });
          }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          await syncAppUser({
            id: user.id,
            email: user.email,
            name: user.name,
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
