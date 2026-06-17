import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateCalendarWebhookChannel } from "@/lib/webhooks/calendar-channel-validation";

export { validateCalendarWebhookChannel } from "@/lib/webhooks/calendar-channel-validation";

export async function verifyCalendarWebhookChannel(
  tenantId: string,
  channelId: string | null,
  channelToken: string | null
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const [user] = await db
    .select({
      calendarWatchChannelId: users.calendarWatchChannelId,
      calendarWatchChannelToken: users.calendarWatchChannelToken,
    })
    .from(users)
    .where(eq(users.id, tenantId))
    .limit(1);

  return validateCalendarWebhookChannel(
    user?.calendarWatchChannelToken,
    channelToken,
    user?.calendarWatchChannelId,
    channelId
  );
}
