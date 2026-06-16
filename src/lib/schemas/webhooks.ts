import { z } from "zod";
import { LIMITS } from "@/lib/schemas/limits";
import { nonEmptyBoundedString, strictObject } from "@/lib/schemas/primitives";

/** Gmail users.watch / Calendar events.watch API response. */
export const googleWatchResponseSchema = strictObject({
  expiration: z.union([z.string().max(32), z.number().finite()]).optional(),
  historyId: z.union([z.string().max(32), z.number().finite()]).optional(),
  resourceId: nonEmptyBoundedString(LIMITS.SHORT_STRING, "resourceId").optional(),
  resourceUri: z.string().url().max(LIMITS.URL).optional(),
});

export type GoogleWatchResponse = z.infer<typeof googleWatchResponseSchema>;

export function parseGoogleWatchResponse(body: string): {
  expiration: Date | null;
  raw: GoogleWatchResponse;
} {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error("Google watch API returned invalid JSON");
  }

  const parsed = googleWatchResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Google watch API returned an unexpected response shape");
  }

  const expirationRaw = parsed.data.expiration;
  const expirationMs =
    expirationRaw === undefined ? null : Number(expirationRaw);
  const expiration =
    expirationMs !== null && !Number.isNaN(expirationMs) ? new Date(expirationMs) : null;

  return {
    expiration: expiration && !Number.isNaN(expiration.getTime()) ? expiration : null,
    raw: parsed.data,
  };
}

export const webhookTenantIdSchema = nonEmptyBoundedString(LIMITS.TENANT_ID, "tenantId");

export const cronForceQuerySchema = strictObject({
  force: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});
