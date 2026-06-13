import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  countRowsNeedingReembed,
  isReembedRunning,
  triggerReembedInbox,
} from "@/lib/embeddings/reembed-inbox";
import { assertPhase2Env } from "@/lib/env";
import { reembedBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, reembedBodySchema);
  if (!parsed.ok) return parsed.response;

  const { provider } = parsed.data;

  if (isReembedRunning(auth.userId, provider)) {
    return NextResponse.json({ status: "running" as const, provider });
  }

  const total = await countRowsNeedingReembed(auth.userId, provider);
  if (total === 0) {
    return NextResponse.json({ status: "nothing-to-do" as const, provider, total: 0 });
  }

  triggerReembedInbox(auth.userId, provider);

  return NextResponse.json({ status: "started" as const, provider, total });
}
