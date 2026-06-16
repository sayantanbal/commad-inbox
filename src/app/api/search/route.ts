import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { auth } from "@/lib/auth";
import { assertAiAvailable } from "@/lib/ai/runtime";
import { aiErrorResponse } from "@/lib/api/ai-error-response";
import { getInboxIndexStatus } from "@/lib/backfill/inbox-index-status";
import { semanticSearch } from "@/lib/search/semantic";
import { searchBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertAiAvailable(session.user.id);
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "Phase 2 not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, searchBodySchema);
  if (!parsed.ok) return parsed.response;

  const [results, indexStatus] = await Promise.all([
    semanticSearch(session.user.id, parsed.data.query, parsed.data.limit, parsed.data.provider),
    getInboxIndexStatus(session.user.id),
  ]);

  return NextResponse.json({
    results,
    indexing: {
      partial: !indexStatus.fullIndexComplete,
      indexedCount: indexStatus.indexedCount,
      inboxTotalThreads: indexStatus.inboxTotalThreads,
    },
  });
}
