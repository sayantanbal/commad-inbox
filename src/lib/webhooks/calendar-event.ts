import { format } from "date-fns";
import { fetchEventsForTenant } from "@/lib/corsair/events";
import { getTenantForUser } from "@/lib/corsair/tenant";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";
import { invalidateDailyBriefCache } from "@/lib/ai/daily-brief-cache";

export async function handleCalendarEventChanged(tenantId: string): Promise<void> {
  await invalidateDailyBriefCache(tenantId);

  const anchor = new Date();
  const month = format(anchor, "yyyy-MM");
  let events: Awaited<ReturnType<typeof fetchEventsForTenant>> = [];

  try {
    events = await fetchEventsForTenant(getTenantForUser(tenantId), anchor);
  } catch (error) {
    console.error("[webhook] calendar Corsair fetch failed", error);
  }

  await broadcastInboxEvent(tenantId, {
    type: "calendar-updated",
    month,
    events: events.map((event) => ({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    })),
  });
}
