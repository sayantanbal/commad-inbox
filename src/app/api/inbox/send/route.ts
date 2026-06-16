import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { enforceUserRateLimit } from "@/lib/api/user-rate-limit";
import { cancelQueuedSend, dispatchScheduledSend, queueSend } from "@/lib/inbox/scheduled-sends";
import { scheduledSendIdBodySchema, sendBodySchema } from "@/lib/schemas/api";

const UNDO_WINDOW_MS = 5000;

function checkSendRateLimit(userId: string) {
  return enforceUserRateLimit(userId, "inbox-send");
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = checkSendRateLimit(auth.userId);
  if (rateLimited) return rateLimited;

  const parsed = await parseJsonBody(request, sendBodySchema);
  if (!parsed.ok) return parsed.response;

  const sendAt = parsed.data.sendAt
    ? new Date(parsed.data.sendAt)
    : new Date(Date.now() + UNDO_WINDOW_MS);

  const queued = await queueSend(auth.userId, {
    to: parsed.data.to,
    subject: parsed.data.subject,
    body: parsed.data.body,
    threadId: parsed.data.threadId,
    sendAt,
    attachmentIds: parsed.data.attachmentIds,
  });

  return NextResponse.json({
    scheduledSendId: queued.id,
    sendAt: queued.sendAt.toISOString(),
    undoWindowMs: parsed.data.sendAt ? 0 : UNDO_WINDOW_MS,
  });
}

export async function PUT(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = checkSendRateLimit(auth.userId);
  if (rateLimited) return rateLimited;

  const parsed = await parseJsonBody(request, scheduledSendIdBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await dispatchScheduledSend(
      auth.tenant,
      auth.userId,
      parsed.data.scheduledSendId,
      auth.userEmail
    );
    if (!result) {
      return NextResponse.json({ error: "Send not ready or already handled" }, { status: 409 });
    }
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, scheduledSendIdBodySchema);
  if (!parsed.ok) return parsed.response;

  const cancelled = await cancelQueuedSend(auth.userId, parsed.data.scheduledSendId);
  return NextResponse.json({ success: cancelled });
}
