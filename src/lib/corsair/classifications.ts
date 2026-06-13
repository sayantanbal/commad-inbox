import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classifications } from "@/lib/db/schema";
import type { Classification, Priority, Thread, TriageLane } from "@/lib/types";

/** Phase 2 classifier fills this table via webhooks; until then defaults apply. */
const DEFAULT_LANE: TriageLane = "reply";
const DEFAULT_PRIORITY: Priority = "medium";

export async function getClassificationsForUser(userId: string): Promise<Classification[]> {
  const rows = await db
    .select()
    .from(classifications)
    .where(eq(classifications.userId, userId));

  return rows.map((row) => ({
    threadId: row.threadId,
    priority: row.priority,
    lane: row.lane,
    subject: row.subject,
    sender: row.sender,
    snippet: row.snippet,
    schedulingIntent: row.schedulingIntent
      ? {
          proposedTimes: row.schedulingIntent.proposedTimes.map((time) => new Date(time)),
          attendees: row.schedulingIntent.attendees,
          duration: row.schedulingIntent.duration,
          confidence: row.schedulingIntent.confidence,
        }
      : null,
    classifiedAt: row.classifiedAt,
  }));
}

export function withDefaultClassifications(
  threads: Thread[],
  existing: Classification[],
  options?: { backfillComplete?: boolean }
): Classification[] {
  const byThreadId = new Map(existing.map((item) => [item.threadId, item]));
  const backfillComplete = options?.backfillComplete ?? false;

  return threads
    .map((thread) => {
      const stored = byThreadId.get(thread.id);
      if (stored) return stored;

      if (backfillComplete) {
        return null;
      }

      const sender = thread.participants[0]?.name ?? thread.participants[0]?.email ?? "Unknown";

      return {
        threadId: thread.id,
        priority: DEFAULT_PRIORITY,
        lane: DEFAULT_LANE,
        subject: thread.subject,
        sender,
        snippet: thread.snippet,
        schedulingIntent: null,
        classifiedAt: thread.timestamp,
      };
    })
    .filter((item): item is Classification => item !== null);
}

