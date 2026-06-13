import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionApi } from "@/lib/api/require-session";
import { cancelQueuedSend, dispatchScheduledSend, queueSend } from "@/lib/inbox/scheduled-sends";

const UNDO_WINDOW_MS = 5000;

const sendSchema = z.object({
  to: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  threadId: z.string().optional(),
  sendAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = sendSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sendAt = parsed.data.sendAt
    ? new Date(parsed.data.sendAt)
    : new Date(Date.now() + UNDO_WINDOW_MS);

  const queued = await queueSend(auth.userId, {
    to: parsed.data.to,
    subject: parsed.data.subject,
    body: parsed.data.body,
    threadId: parsed.data.threadId,
    sendAt,
  });

  return NextResponse.json({
    scheduledSendId: queued.id,
    sendAt: queued.sendAt.toISOString(),
    undoWindowMs: parsed.data.sendAt ? 0 : UNDO_WINDOW_MS,
  });
}

const dispatchSchema = z.object({
  scheduledSendId: z.string().min(1),
});

export async function PUT(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = dispatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

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

const cancelSchema = z.object({
  scheduledSendId: z.string().min(1),
});

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = cancelSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const cancelled = await cancelQueuedSend(auth.userId, parsed.data.scheduledSendId);
  return NextResponse.json({ success: cancelled });
}
