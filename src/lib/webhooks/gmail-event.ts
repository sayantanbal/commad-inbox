import { classifyThreadForUser } from "@/lib/classifier/persist";
import { invalidateDailyBriefCache } from "@/lib/ai/daily-brief-cache";
import { corsair } from "@/lib/corsair";

type GmailWebhookEvent = {
  type?: string;
  message?: { threadId?: string };
};

export async function handleGmailMessageChanged(
  tenantId: string,
  body: unknown
): Promise<void> {
  const event = body as GmailWebhookEvent;
  if (event.type !== "messageReceived") {
    return;
  }

  const threadId = event.message?.threadId;
  if (!threadId) return;

  const tenant = corsair.withTenant(tenantId);
  await classifyThreadForUser(tenantId, tenant, threadId);
  await invalidateDailyBriefCache(tenantId);
}
