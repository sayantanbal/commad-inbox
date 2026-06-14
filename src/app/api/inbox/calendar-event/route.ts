import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { updateCalendarEventTime } from "@/lib/corsair/actions";
import { calendarEventPatchBodySchema } from "@/lib/schemas/api";

export async function PATCH(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, calendarEventPatchBodySchema);
  if (!parsed.ok) return parsed.response;

  const slotStart = new Date(parsed.data.slotStart);
  const durationMinutes = parsed.data.durationMinutes ?? 30;

  try {
    const updated = await updateCalendarEventTime(auth.tenant, {
      eventId: parsed.data.eventId,
      start: slotStart,
      durationMinutes,
    });

    return NextResponse.json({
      success: true,
      eventId: updated.eventId,
      hangoutLink: updated.hangoutLink,
      htmlLink: updated.htmlLink,
      start: slotStart.toISOString(),
      end: new Date(slotStart.getTime() + durationMinutes * 60_000).toISOString(),
      durationMinutes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendar update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
