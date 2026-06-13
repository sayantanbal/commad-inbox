import { format, parse } from "date-fns";
import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { fetchEventsForTenant } from "@/lib/corsair/events";

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const monthParam = new URL(request.url).searchParams.get("month");
  let anchor = new Date();
  if (monthParam) {
    const parsed = parse(`${monthParam}-01`, "yyyy-MM-dd", new Date());
    if (!Number.isNaN(parsed.getTime())) {
      anchor = parsed;
    }
  }

  try {
    const events = await fetchEventsForTenant(auth.tenant, anchor);
    return NextResponse.json({
      events: events.map((event) => ({
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
      })),
      month: format(anchor, "yyyy-MM"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
