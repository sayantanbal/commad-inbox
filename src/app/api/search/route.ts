import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { auth } from "@/lib/auth";
import { assertPhase2Env } from "@/lib/env";
import { semanticSearch } from "@/lib/search/semantic";
import { searchBodySchema } from "@/lib/schemas/api";

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

  const parsed = await parseJsonBody(request, searchBodySchema);
  if (!parsed.ok) return parsed.response;

  const results = await semanticSearch(
    session.user.id,
    parsed.data.query,
    parsed.data.limit,
    parsed.data.provider
  );

  return NextResponse.json({ results });
}
