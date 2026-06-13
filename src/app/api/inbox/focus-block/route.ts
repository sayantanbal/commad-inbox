import { addMinutes } from "date-fns";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { createCalendarFocusBlock, cancelCalendarEvent } from "@/lib/corsair/actions";
import { focusBlockBodySchema, focusBlockDeleteBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, focusBlockBodySchema);
  if (!parsed.ok) return parsed.response;

  const { start, durationMinutes, summary } = parsed.data;
  const slotStart = new Date(start);
  if (Number.isNaN(slotStart.getTime())) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  try {
    const created = await createCalendarFocusBlock(auth.tenant, {
      summary,
      start: slotStart,
      durationMinutes,
    });

    const slotEnd = addMinutes(slotStart, durationMinutes);

    return NextResponse.json({
      eventId: created.eventId,
      summary: summary ?? "Focus time",
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      htmlLink: created.htmlLink,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not block focus time";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, focusBlockDeleteBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    await cancelCalendarEvent(auth.tenant, parsed.data.eventId);
    return NextResponse.json({ eventId: parsed.data.eventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove focus block";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
