import { classifyThreadForUser } from "@/lib/classifier/persist";
import { invalidateDailyBriefCache } from "@/lib/ai/daily-brief-cache";
import { extractCommitmentsForUser } from "@/lib/commitments/persist";
import { maybeSendFocusAutoReply } from "@/lib/focus/auto-reply";
import { corsair } from "@/lib/corsair";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";
import { eq } from "drizzle-orm";
import { shouldClassifyGmailEvent, getClassifyThreadIdFromGmailWebhook } from "@/lib/webhooks/gmail-event-filter";

export { shouldClassifyGmailEvent } from "@/lib/webhooks/gmail-event-filter";

export async function handleGmailMessageChanged(
  tenantId: string,
  body: unknown
): Promise<void> {
  await broadcastInboxEvent(tenantId, { type: "inbox-changed", reason: "gmail" });

  if (!shouldClassifyGmailEvent(body)) {
    return;
  }

  const threadId = getClassifyThreadIdFromGmailWebhook(body);
  if (!threadId) {
    return;
  }
  const tenant = corsair.withTenant(tenantId);
  const classification = await classifyThreadForUser(tenantId, tenant, threadId);
  await invalidateDailyBriefCache(tenantId);

  if (classification) {
    void extractCommitmentsForUser(tenantId, tenant, threadId, classification.lane).catch(
      (error) => console.error("[commitments] webhook extract failed", threadId, error)
    );
  }

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, tenantId));
  if (user?.email) {
    void maybeSendFocusAutoReply(tenantId, user.email, tenant, threadId).catch((error) =>
      console.error("[focus] auto-reply failed", threadId, error)
    );
  }
}
