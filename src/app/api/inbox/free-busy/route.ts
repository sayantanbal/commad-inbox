import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { fetchGoogleFreeBusy } from "@/lib/calendar/google-free-busy";

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
    const busy = await fetchGoogleFreeBusy(auth.tenant, emails, start, end);
    return NextResponse.json({ busy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Free/busy lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
