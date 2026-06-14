import { z } from "zod";

/** Gmail users.watch / Calendar events.watch API response. */
export const googleWatchResponseSchema = z
  .object({
    expiration: z.union([z.string(), z.number()]).optional(),
    historyId: z.union([z.string(), z.number()]).optional(),
    resourceId: z.string().optional(),
    resourceUri: z.string().optional(),
  })
  .passthrough();

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

export const webhookTenantIdSchema = z.string().min(1, "tenantId is required");

export const cronForceQuerySchema = z.object({
  force: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});
