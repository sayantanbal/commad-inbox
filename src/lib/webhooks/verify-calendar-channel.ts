import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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

  const expectedToken = user?.calendarWatchChannelToken;
  if (!expectedToken) {
    return {
      ok: false,
      status: 503,
      message: "Calendar watch not configured — renew watches for this tenant",
    };
  }

  if (!channelToken || channelToken !== expectedToken) {
    return { ok: false, status: 401, message: "Invalid channel token" };
  }

  const expectedChannelId = user?.calendarWatchChannelId;
  if (expectedChannelId && channelId && channelId !== expectedChannelId) {
    return { ok: false, status: 401, message: "Invalid channel id" };
  }

  return { ok: true };
}
