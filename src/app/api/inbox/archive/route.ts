import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { archiveGmailThread } from "@/lib/corsair/actions";
import { setThreadLane } from "@/lib/inbox/classification-lane";
import { archiveBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, archiveBodySchema);
  if (!parsed.ok) return parsed.response;

  const { threadId } = parsed.data;

  try {
    await archiveGmailThread(auth.tenant, threadId);
    const classification = await setThreadLane(auth.userId, threadId, "done");
    return NextResponse.json({ success: true, classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Archive failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
