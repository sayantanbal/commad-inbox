import type { z } from "zod";

export type ParseQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues: z.ZodIssue[] };

/**
 * Validate URL search params at the API boundary.
 */
export function parseSearchParams<T extends z.ZodType>(
  url: URL,
  schema: T
): ParseQueryResult<z.infer<T>> {
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid query parameters",
      issues: parsed.error.issues,
    };
  }
  return { ok: true, data: parsed.data };
}
