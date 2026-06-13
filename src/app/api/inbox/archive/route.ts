import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionApi } from "@/lib/api/require-session";
import { archiveGmailThread } from "@/lib/corsair/actions";
import { setThreadLane } from "@/lib/inbox/classification-lane";

const bodySchema = z.object({
  threadId: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

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
