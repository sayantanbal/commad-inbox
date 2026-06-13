import { eq } from "drizzle-orm";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { classifyThreadForUser } from "@/lib/classifier/persist";
import { corsair } from "@/lib/corsair";
import { db } from "@/lib/db";
import { classifications, users } from "@/lib/db/schema";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";
import { isBackfillComplete } from "@/lib/users/backfill-status";

export const BACKFILL_THREAD_LIMIT = 50;

export async function runInboxBackfill(userId: string): Promise<void> {
  if (await isBackfillComplete(userId)) {
    return;
  }

  const tenant = corsair.withTenant(userId);
  const listed = await tenant.gmail.api.threads.list({
    maxResults: BACKFILL_THREAD_LIMIT,
    labelIds: ["INBOX"],
  });

  const threadIds =
    listed.threads?.map((t) => t.id).filter((id): id is string => Boolean(id)) ?? [];

  const existing = await db
    .select({ threadId: classifications.threadId })
    .from(classifications)
    .where(eq(classifications.userId, userId));
  const existingIds = new Set(existing.map((row) => row.threadId));

  const toProcess = threadIds.filter((id) => !existingIds.has(id));
  const total = toProcess.length;
  let completed = 0;
  let quotaExhausted = false;

  for (const threadId of toProcess) {
    try {
      await classifyThreadForUser(userId, tenant, threadId);
    } catch (error) {
      if (isRateLimitError(error)) {
        quotaExhausted = true;
        console.warn("[backfill] AI quota exhausted — pausing backfill");
        break;
      }
      console.error("[backfill] thread failed", threadId, error);
    }
    completed += 1;
    await broadcastInboxEvent(userId, {
      type: "backfill-progress",
      completed,
      total,
    });
    await sleep(400);
  }

  if (quotaExhausted) {
    return;
  }

  const remaining = await db
    .select({ threadId: classifications.threadId })
    .from(classifications)
    .where(eq(classifications.userId, userId));
  const classifiedIds = new Set(remaining.map((row) => row.threadId));
  const allDone = toProcess.every((id) => classifiedIds.has(id));

  if (!allDone && toProcess.length > 0) {
    return;
  }

  await db
    .update(users)
    .set({ backfillCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  await broadcastInboxEvent(userId, { type: "backfill-complete" });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function triggerInboxBackfill(userId: string): void {
  void runInboxBackfill(userId).catch((error) => {
    console.error("[backfill] failed for user", userId, error);
  });
}
