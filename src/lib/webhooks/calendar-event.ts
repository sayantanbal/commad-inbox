import { broadcastInboxEvent } from "@/lib/realtime/pusher";
import { invalidateDailyBriefCache } from "@/lib/ai/daily-brief-cache";

export async function handleCalendarEventChanged(tenantId: string): Promise<void> {
  await invalidateDailyBriefCache(tenantId);
  await broadcastInboxEvent(tenantId, { type: "calendar-updated" });
}
