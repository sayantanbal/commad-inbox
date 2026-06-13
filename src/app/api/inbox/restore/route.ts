import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionApi } from "@/lib/api/require-session";
import { restoreGmailThread } from "@/lib/corsair/actions";
import { setThreadLane } from "@/lib/inbox/classification-lane";
import type { TriageLane } from "@/lib/types";

const bodySchema = z.object({
  threadId: z.string().min(1),
  lane: z.enum(["reply", "schedule", "fyi", "done"]),
});

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await restoreGmailThread(auth.tenant, parsed.data.threadId);
    const classification = await setThreadLane(
      auth.userId,
      parsed.data.threadId,
      parsed.data.lane as TriageLane
    );
    return NextResponse.json({ success: true, classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
