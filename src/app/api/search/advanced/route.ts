import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { advancedSearch } from "@/lib/search/advanced";
import { advancedSearchBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, advancedSearchBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const results = await advancedSearch(auth.userId, auth.tenant, parsed.data);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Advanced search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
