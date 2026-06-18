import { handleCalendarEventChanged } from "@/lib/webhooks/calendar-event";
import { shouldHandleGoogleCalendarPush } from "@/lib/webhooks/calendar-webhook-routing";
import { verifyCalendarWebhookChannel } from "@/lib/webhooks/verify-calendar-channel";
import { webhookTenantIdSchema } from "@/lib/schemas/webhooks";

export const runtime = "nodejs";

/**
 * Google Calendar `events.watch` push (raw Google headers, not Corsair JSON).
 * Verifies channel id + token, then handleCalendarEventChanged — same handler as
 * googlecalendar.eventChanged on /api/webhooks.
 */
export async function POST(request: Request) {
  const tenantIdParam = new URL(request.url).searchParams.get("tenantId");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (!shouldHandleGoogleCalendarPush(resourceState)) {
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
