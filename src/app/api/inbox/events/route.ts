import { format, parse } from "date-fns";
import { NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/api/parse-query";
import { requireSessionApi } from "@/lib/api/require-session";
import { fetchEventsForTenant } from "@/lib/corsair/events";
import { eventsMonthQuerySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const query = parseSearchParams(url, eventsMonthQuerySchema);
  if (!query.ok) {
    return NextResponse.json(
      {
        error: query.error,
        issues: query.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  let anchor = new Date();
  if (query.data.month) {
    const parsed = parse(`${query.data.month}-01`, "yyyy-MM-dd", new Date());
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
