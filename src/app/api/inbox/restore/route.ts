import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { restoreGmailThread } from "@/lib/corsair/actions";
import { setThreadLane } from "@/lib/inbox/classification-lane";
import { restoreBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, restoreBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    await restoreGmailThread(auth.tenant, parsed.data.threadId);
    const classification = await setThreadLane(
      auth.userId,
      parsed.data.threadId,
      parsed.data.lane
    );
    return NextResponse.json({ success: true, classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
