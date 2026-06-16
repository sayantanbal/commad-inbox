import { count, eq } from "drizzle-orm";
import type { InboxIndexStatus } from "@/lib/backfill/inbox-index-format";
import { db } from "@/lib/db";
import { classifications, users } from "@/lib/db/schema";

export type { InboxIndexStatus } from "@/lib/backfill/inbox-index-format";
export { formatFullIndexBannerDetail } from "@/lib/backfill/inbox-index-format";

export async function getInboxIndexStatus(userId: string): Promise<InboxIndexStatus> {
  const [user] = await db
    .select({
      backfillCompletedAt: users.backfillCompletedAt,
      fullIndexCompletedAt: users.fullIndexCompletedAt,
      inboxIndexTotalThreads: users.inboxIndexTotalThreads,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [indexed] = await db
    .select({ count: count() })
    .from(classifications)
    .where(eq(classifications.userId, userId));

  const indexedCount = Number(indexed?.count ?? 0);
  const inboxTotalThreads = user?.inboxIndexTotalThreads ?? null;
  const remainingThreads =
    inboxTotalThreads != null ? Math.max(0, inboxTotalThreads - indexedCount) : 0;

  return {
    quickBackfillComplete: Boolean(user?.backfillCompletedAt),
    fullIndexComplete: Boolean(user?.fullIndexCompletedAt),
    indexedCount,
    inboxTotalThreads,
    remainingThreads,
  };
}
