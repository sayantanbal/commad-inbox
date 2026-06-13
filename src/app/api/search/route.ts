import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { assertPhase2Env } from "@/lib/env";
import { semanticSearch } from "@/lib/search/semantic";

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Phase 2 not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const results = await semanticSearch(
    session.user.id,
    parsed.data.query,
    parsed.data.limit ?? 20
  );

  return NextResponse.json({ results });
}
