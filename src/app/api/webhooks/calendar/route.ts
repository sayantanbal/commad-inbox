import { handleCalendarEventChanged } from "@/lib/webhooks/calendar-event";

export const runtime = "nodejs";

/** Google Calendar push notifications (events.watch). */
export async function POST(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (resourceState === "sync") {
    return new Response("", { status: 200 });
  }

  if (!tenantId) {
    return new Response("Missing tenantId", { status: 400 });
  }

  void handleCalendarEventChanged(tenantId).catch((error) => {
    console.error("[webhook] calendar push failed", error);
  });

  return new Response("", { status: 200 });
}
