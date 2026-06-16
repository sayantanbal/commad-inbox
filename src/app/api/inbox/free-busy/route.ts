import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { fetchBusyFromCorsairEvents } from "@/lib/calendar/corsair-events-busy";

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const emails = url.searchParams.get("emails")?.split(",").filter(Boolean) ?? [];
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  try {
    const busy = await fetchBusyFromCorsairEvents(
      auth.tenant,
      emails,
      start,
      end,
      auth.userEmail
    );
    return NextResponse.json({ busy, source: "corsair-calendar-events" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Busy lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
