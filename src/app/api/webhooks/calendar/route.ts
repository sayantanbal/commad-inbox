import { handleCalendarEventChanged } from "@/lib/webhooks/calendar-event";
import { verifyCalendarWebhookChannel } from "@/lib/webhooks/verify-calendar-channel";
import { webhookTenantIdSchema } from "@/lib/schemas/webhooks";

export const runtime = "nodejs";

/** Google Calendar push notifications (events.watch). */
export async function POST(request: Request) {
  const tenantIdParam = new URL(request.url).searchParams.get("tenantId");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (resourceState === "sync") {
    return new Response("", { status: 200 });
  }

  const tenantParsed = webhookTenantIdSchema.safeParse(tenantIdParam);
  if (!tenantParsed.success) {
    return new Response("Missing tenantId", { status: 400 });
  }

  const tenantId = tenantParsed.data;

  const channelId = request.headers.get("x-goog-channel-id");
  const channelToken = request.headers.get("x-goog-channel-token");
  const verified = await verifyCalendarWebhookChannel(tenantId, channelId, channelToken);
  if (!verified.ok) {
    return new Response(verified.message, { status: verified.status });
  }

  void handleCalendarEventChanged(tenantId).catch((error) => {
    console.error("[webhook] calendar push failed", error);
  });

  return new Response("", { status: 200 });
}
