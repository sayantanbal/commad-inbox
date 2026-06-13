import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { advancedSearch } from "@/lib/search/advanced";
import { advancedSearchBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) {
    return NextResponse.json({ error: "Google not connected" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, advancedSearchBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const tenant = corsair.withTenant(session.user.id);
    const results = await advancedSearch(session.user.id, tenant, parsed.data);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Advanced search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
