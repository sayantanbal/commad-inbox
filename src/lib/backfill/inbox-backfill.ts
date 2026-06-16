import { eq } from "drizzle-orm";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import {
  CLASSIFICATION_COVERAGE_THRESHOLD,
  CLASSIFY_BATCH_DELAY_MS,
  FULL_INBOX_INDEX_MAX_THREADS,
  QUICK_BACKFILL_LIMIT,
} from "@/lib/backfill/constants";
import { listAllInboxThreadIds } from "@/lib/backfill/list-inbox-thread-ids";
import { classifyThreadForUser } from "@/lib/classifier/persist";
import { corsair } from "@/lib/corsair";
import { db } from "@/lib/db";
import { classifications, users } from "@/lib/db/schema";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";
import { isBackfillComplete } from "@/lib/users/backfill-status";

export {
  BACKFILL_THREAD_LIMIT,
  CLASSIFICATION_COVERAGE_THRESHOLD,
  QUICK_BACKFILL_LIMIT,
} from "@/lib/backfill/constants";

const inFlight = new Set<string>();

export function needsClassificationBoost(storedCount: number, threadCount: number): boolean {
  if (threadCount === 0) return false;
  const target = Math.min(threadCount, QUICK_BACKFILL_LIMIT);
  return storedCount / target < CLASSIFICATION_COVERAGE_THRESHOLD;
}

async function getClassifiedThreadIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ threadId: classifications.threadId })
    .from(classifications)
    .where(eq(classifications.userId, userId));
  return new Set(rows.map((row) => row.threadId));
}

async function classifyThreadBatch(
  userId: string,
  tenant: ReturnType<typeof corsair.withTenant>,
  threadIds: string[],
  options: {
    onProgress: (completed: number, total: number) => Promise<void>;
  }
): Promise<{ completed: number; quotaExhausted: boolean }> {
  let completed = 0;
  const total = threadIds.length;

  for (const threadId of threadIds) {
    try {
      await classifyThreadForUser(userId, tenant, threadId);
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn("[index] AI quota exhausted — pausing");
        return { completed, quotaExhausted: true };
      }
      console.error("[index] thread failed", threadId, error);
    }

    completed += 1;
    await options.onProgress(completed, total);
    await sleep(CLASSIFY_BATCH_DELAY_MS);
  }

  return { completed, quotaExhausted: false };
}

/** Phase 1: classify the most recent INBOX threads so lanes work immediately. */
export async function runQuickBackfill(userId: string): Promise<void> {
  if (await isBackfillComplete(userId)) {
    return;
  }

  const tenant = corsair.withTenant(userId);
  const listed = await tenant.gmail.api.threads.list({
    maxResults: QUICK_BACKFILL_LIMIT,
    labelIds: ["INBOX"],
  });

  const threadIds =
    listed.threads?.map((thread) => thread.id).filter((id): id is string => Boolean(id)) ?? [];

  const existingIds = await getClassifiedThreadIds(userId);
  const toProcess = threadIds.filter((id) => !existingIds.has(id));
  const { quotaExhausted } = await classifyThreadBatch(userId, tenant, toProcess, {
    onProgress: async (completed, total) => {
      await broadcastInboxEvent(userId, {
        type: "backfill-progress",
        phase: "quick",
        completed,
        total,
      });
    },
  });

  if (quotaExhausted) {
    return;
  }

  const classifiedCount = (
    await db
      .select({ threadId: classifications.threadId })
      .from(classifications)
      .where(eq(classifications.userId, userId))
  ).length;

  const inboxTarget = Math.min(threadIds.length, QUICK_BACKFILL_LIMIT);
  if (inboxTarget > 0 && classifiedCount < inboxTarget * CLASSIFICATION_COVERAGE_THRESHOLD) {
    return;
  }

  const classifiedIds = await getClassifiedThreadIds(userId);
  const allQuickDone = toProcess.every((id) => classifiedIds.has(id));
  if (!allQuickDone && toProcess.length > 0) {
    return;
  }

  await db
    .update(users)
    .set({ backfillCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  await broadcastInboxEvent(userId, { type: "backfill-complete" });
}

async function isFullIndexComplete(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ fullIndexCompletedAt: users.fullIndexCompletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(user?.fullIndexCompletedAt);
}

/** Phase 2: classify + embed the rest of the INBOX in the background. */
export async function runFullInboxIndex(userId: string): Promise<void> {
  if (await isFullIndexComplete(userId)) {
    return;
  }

  const tenant = corsair.withTenant(userId);
  const allThreadIds = await listAllInboxThreadIds(tenant, {
    maxThreads: FULL_INBOX_INDEX_MAX_THREADS,
  });

  await db
    .update(users)
    .set({
      inboxIndexTotalThreads: allThreadIds.length,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const existingIds = await getClassifiedThreadIds(userId);
  const toProcess = allThreadIds.filter((id) => !existingIds.has(id));
  const totalInbox = allThreadIds.length;
  const indexedSoFar = existingIds.size;

  if (toProcess.length === 0) {
    await db
      .update(users)
      .set({ fullIndexCompletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
    await broadcastInboxEvent(userId, {
      type: "full-index-complete",
      total: totalInbox,
      indexed: existingIds.size,
    });
    return;
  }

  await broadcastInboxEvent(userId, {
    type: "full-index-progress",
    completed: indexedSoFar,
    total: totalInbox,
    remaining: toProcess.length,
    batchCompleted: 0,
    batchTotal: toProcess.length,
  });

  const { quotaExhausted } = await classifyThreadBatch(userId, tenant, toProcess, {
    onProgress: async (completed, total) => {
      const indexedSoFar = existingIds.size + completed;
      const remaining = Math.max(0, totalInbox - indexedSoFar);
      await broadcastInboxEvent(userId, {
        type: "full-index-progress",
        completed: indexedSoFar,
        total: totalInbox,
        remaining,
        batchCompleted: completed,
        batchTotal: total,
      });
    },
  });

  if (quotaExhausted) {
    return;
  }

  await db
    .update(users)
    .set({ fullIndexCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));

  const finalIndexed = (await getClassifiedThreadIds(userId)).size;
  await broadcastInboxEvent(userId, {
    type: "full-index-complete",
    total: totalInbox,
    indexed: finalIndexed,
  });
}

/** Quick lanes first, then full INBOX index in the background. */
export async function runInboxBackfill(userId: string): Promise<void> {
  await runQuickBackfill(userId);

  if (!(await isBackfillComplete(userId))) {
    return;
  }

  await runFullInboxIndex(userId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function triggerInboxBackfill(userId: string): void {
  if (inFlight.has(userId)) {
    return;
  }
  inFlight.add(userId);
  void runInboxBackfill(userId)
    .catch((error) => {
      console.error("[backfill] failed for user", userId, error);
    })
    .finally(() => {
      inFlight.delete(userId);
    });
}

export function triggerFullInboxIndex(userId: string): void {
  if (inFlight.has(userId)) {
    return;
  }
  inFlight.add(userId);
  void runFullInboxIndex(userId)
    .catch((error) => {
      console.error("[full-index] failed for user", userId, error);
    })
    .finally(() => {
      inFlight.delete(userId);
    });
}

export async function runInboxReclassify(userId: string): Promise<void> {
  const tenant = corsair.withTenant(userId);
  const listed = await tenant.gmail.api.threads.list({
    maxResults: QUICK_BACKFILL_LIMIT,
    labelIds: ["INBOX"],
  });

  const threadIds =
    listed.threads?.map((thread) => thread.id).filter((id): id is string => Boolean(id)) ?? [];

  const existingIds = await getClassifiedThreadIds(userId);
  const toProcess = threadIds.filter((id) => !existingIds.has(id));
  if (toProcess.length === 0) {
    return;
  }

  await classifyThreadBatch(userId, tenant, toProcess, {
    onProgress: async (completed, total) => {
      await broadcastInboxEvent(userId, {
        type: "backfill-progress",
        phase: "quick",
        completed,
        total,
      });
    },
  });
}

export function triggerInboxReclassify(userId: string): void {
  void runInboxReclassify(userId).catch((error) => {
    console.error("[reclassify] failed for user", userId, error);
  });
}
