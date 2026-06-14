import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { generateConfirmationDraft } from "@/lib/ai/drafts";
import { assertAiAvailable } from "@/lib/ai/runtime";
import { aiErrorResponse } from "@/lib/api/ai-error-response";
import {
  cancelCalendarEvent,
  createCalendarEventWithMeet,
  resolveMeetingAttendees,
  updateCalendarEventTime,
} from "@/lib/corsair/actions";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { getClassificationsForUser } from "@/lib/corsair/classifications";
import { setThreadLane } from "@/lib/inbox/classification-lane";
import {
  deleteThreadMeeting,
  getThreadMeetingForThread,
  upsertThreadMeeting,
} from "@/lib/inbox/thread-meetings";
import { meetingCancelBodySchema, meetingCreateBodySchema } from "@/lib/schemas/api";

async function loadThreadContext(
  auth: Exclude<Awaited<ReturnType<typeof requireSessionApi>>, { error: Response }>,
  threadId: string
) {
  const full = await auth.tenant.gmail.api.threads.get({
    id: threadId,
    format: "full",
  });
  const thread = mapGmailThread(full);
  if (!thread) {
    return null;
  }

  const stored = (await getClassificationsForUser(auth.userId)).find(
    (item) => item.threadId === threadId
  );

  return { thread, stored };
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    await assertAiAvailable(auth.userId);
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, meetingCreateBodySchema);
  if (!parsed.ok) return parsed.response;

  const existing = await getThreadMeetingForThread(auth.userId, parsed.data.threadId);
  if (existing) {
    return NextResponse.json(
      { error: "Thread already has a meeting — use reschedule instead" },
      { status: 409 }
    );
  }

  try {
    const context = await loadThreadContext(auth, parsed.data.threadId);
    if (!context) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { thread, stored } = context;
    const schedulingIntent = stored?.schedulingIntent ?? null;
    const durationMinutes =
      parsed.data.durationMinutes ?? schedulingIntent?.duration ?? 30;
    const attendees = resolveMeetingAttendees(thread, schedulingIntent, auth.userEmail);

    if (attendees.length === 0) {
      return NextResponse.json({ error: "No attendees found for this thread" }, { status: 400 });
    }

    const slotStart = new Date(parsed.data.slotStart);
    const created = await createCalendarEventWithMeet(auth.tenant, {
      summary: thread.subject.startsWith("Re:") ? thread.subject : `Meeting: ${thread.subject}`,
      start: slotStart,
      durationMinutes,
      attendees,
    });

    const draftHtml = await generateConfirmationDraft({
      userId: auth.userId,
      thread,
      slotStart,
      durationMinutes,
      hangoutLink: created.hangoutLink,
    });

    const meeting = await upsertThreadMeeting(auth.userId, {
      threadId: parsed.data.threadId,
      eventId: created.eventId,
      slotStart,
      durationMinutes,
    });

    const classification = await setThreadLane(auth.userId, parsed.data.threadId, "done", {
      subject: thread.subject,
      snippet: thread.snippet,
      sender: stored?.sender,
    });

    return NextResponse.json({
      success: true,
      eventId: created.eventId,
      hangoutLink: created.hangoutLink,
      htmlLink: created.htmlLink,
      draftHtml,
      meeting,
      classification,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meeting creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    await assertAiAvailable(auth.userId);
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, meetingCreateBodySchema);
  if (!parsed.ok) return parsed.response;

  const linked = await getThreadMeetingForThread(auth.userId, parsed.data.threadId);
  if (!linked) {
    return NextResponse.json({ error: "No meeting linked to this thread" }, { status: 404 });
  }

  try {
    const context = await loadThreadContext(auth, parsed.data.threadId);
    if (!context) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { thread, stored } = context;
    const durationMinutes =
      parsed.data.durationMinutes ?? linked.durationMinutes ?? stored?.schedulingIntent?.duration ?? 30;
    const slotStart = new Date(parsed.data.slotStart);

    const updated = await updateCalendarEventTime(auth.tenant, {
      eventId: linked.eventId,
      start: slotStart,
      durationMinutes,
    });

    const draftHtml = await generateConfirmationDraft({
      userId: auth.userId,
      thread,
      slotStart,
      durationMinutes,
      hangoutLink: updated.hangoutLink,
    });

    const meeting = await upsertThreadMeeting(auth.userId, {
      threadId: parsed.data.threadId,
      eventId: updated.eventId,
      slotStart,
      durationMinutes,
    });

    return NextResponse.json({
      success: true,
      eventId: updated.eventId,
      hangoutLink: updated.hangoutLink,
      htmlLink: updated.htmlLink,
      draftHtml,
      meeting,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meeting update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, meetingCancelBodySchema);
  if (!parsed.ok) return parsed.response;

  const linked = await getThreadMeetingForThread(auth.userId, parsed.data.threadId);
  if (!linked) {
    return NextResponse.json({ error: "No meeting linked to this thread" }, { status: 404 });
  }

  try {
    await cancelCalendarEvent(auth.tenant, linked.eventId);
    await deleteThreadMeeting(auth.userId, parsed.data.threadId);

    return NextResponse.json({
      success: true,
      eventId: linked.eventId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meeting cancellation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
