import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { ensureFollowUpDraft } from "@/lib/commitments/follow-up-draft";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { commitmentFollowUpBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, commitmentFollowUpBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await ensureFollowUpDraft(auth.userId, parsed.data.commitmentId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare follow-up";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
