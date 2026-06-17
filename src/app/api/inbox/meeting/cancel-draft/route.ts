import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { generateCancellationDraft } from "@/lib/ai/drafts";
import { assertAiAvailable } from "@/lib/ai/runtime";
import { aiErrorResponse } from "@/lib/api/ai-error-response";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { getThreadMeetingForThread } from "@/lib/inbox/thread-meetings";
import { meetingCancelBodySchema } from "@/lib/schemas/api";

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

  const parsed = await parseJsonBody(request, meetingCancelBodySchema);
  if (!parsed.ok) return parsed.response;

  const linked = await getThreadMeetingForThread(auth.userId, parsed.data.threadId);
  if (!linked) {
    return NextResponse.json({ error: "No meeting linked to this thread" }, { status: 404 });
  }

  try {
    const full = await auth.tenant.gmail.api.threads.get({
      id: parsed.data.threadId,
      format: "full",
    });
    const thread = mapGmailThread(full);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const draftHtml = await generateCancellationDraft({
      userId: auth.userId,
      thread,
      slotStart: linked.start,
      durationMinutes: linked.durationMinutes,
    });

    return NextResponse.json({
      draftHtml,
      eventId: linked.eventId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancellation draft failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
