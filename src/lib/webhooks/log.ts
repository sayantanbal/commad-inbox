import { db } from "@/lib/db";
import { webhookLogs } from "@/lib/db/schema";

export async function logWebhookAttempt(input: {
  userId?: string;
  payload: unknown;
  signature?: string | null;
  verified: boolean;
  error?: string;
}): Promise<void> {
  await db.insert(webhookLogs).values({
    id: crypto.randomUUID(),
    userId: input.userId ?? null,
    payload: input.payload as Record<string, unknown>,
    signature: input.signature ?? null,
    verified: input.verified,
    error: input.error ?? null,
  });
}
