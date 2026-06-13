import { NextResponse } from "next/server";
import type { z } from "zod";

export type ParseJsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function validationErrorResponse(error: z.ZodError): NextResponse {
  const flattened = error.flatten();
  return NextResponse.json(
    {
      error: "Invalid request",
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    },
    { status: 400 }
  );
}

/**
 * Parse and validate a JSON request body at the API boundary.
 * Handles malformed JSON (400) and returns structured field errors from Zod.
 */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<ParseJsonBodyResult<z.infer<T>>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, response: validationErrorResponse(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}
