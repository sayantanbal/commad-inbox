import { z } from "zod";

/** Treat unset or blank env values as undefined for optional vars. */
function optionalNonEmpty() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional()
  );
}

/**
 * Phase 0 (infrastructure) — required to boot DB + Corsair.
 * Phase 1+ vars are optional until those features ship.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /** Corsair key-encryption key (generate: openssl rand -base64 32) */
  CORSAIR_KEK: z.string().min(1, "CORSAIR_KEK is required"),

  GOOGLE_CLIENT_ID: z
    .string()
    .min(1)
    .refine((v) => v.endsWith(".apps.googleusercontent.com"), {
      message:
        "GOOGLE_CLIENT_ID should end with .apps.googleusercontent.com (check for typos)",
    }),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  /** Public app URL for Corsair OAuth redirects (defaults to BETTER_AUTH_URL) */
  APP_URL: z.string().url().optional(),

  /** Session signing secret — required in Phase 1 (Better Auth core) */
  BETTER_AUTH_SECRET: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(32).optional()
  ),

  /** Optional — @better-auth/infra (Dash/Sentinel); not required for local auth */
  BETTER_AUTH_API_KEY: optionalNonEmpty(),

  GOOGLE_GENERATIVE_AI_API_KEY: optionalNonEmpty(),

  /** Gmail Pub/Sub topic for push notifications (projects/…/topics/…) */
  GMAIL_PUBSUB_TOPIC: optionalNonEmpty(),

  PUSHER_APP_ID: optionalNonEmpty(),
  PUSHER_KEY: optionalNonEmpty(),
  PUSHER_SECRET: optionalNonEmpty(),
  PUSHER_CLUSTER: optionalNonEmpty(),

  CRON_SECRET: optionalNonEmpty(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export function getAppUrl(): string {
  return env.APP_URL ?? env.BETTER_AUTH_URL;
}

/** Vars required before enabling sign-in (Phase 1). */
export function assertPhase1Env(): void {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is required for authentication. Generate with: openssl rand -base64 32"
    );
  }
}

/** Vars required for Phase 2 classifier + semantic search. */
export function assertPhase2Env(): void {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is required for Phase 2 classification and search."
    );
  }
}
