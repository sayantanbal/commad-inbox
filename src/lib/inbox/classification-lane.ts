import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classifications } from "@/lib/db/schema";
import type { Classification, Thread, TriageLane } from "@/lib/types";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";

function classificationId(userId: string, threadId: string): string {
  return `${userId}:${threadId}`;
}

export async function setThreadLane(
  userId: string,
  threadId: string,
  lane: TriageLane,
  thread?: Pick<Thread, "subject" | "snippet"> & { sender?: string }
): Promise<Classification | null> {
  const id = classificationId(userId, threadId);
  const [existing] = await db
    .select()
    .from(classifications)
    .where(and(eq(classifications.userId, userId), eq(classifications.threadId, threadId)));

  if (!existing && !thread) {
    return null;
  }

  const row = {
    id,
    userId,
    threadId,
    lane,
    priority: existing?.priority ?? ("medium" as const),
    subject: existing?.subject ?? thread?.subject ?? "(No subject)",
    sender: existing?.sender ?? thread?.sender ?? "Unknown",
    snippet: existing?.snippet ?? thread?.snippet ?? "",
    schedulingIntent: existing?.schedulingIntent ?? null,
    classifiedAt: existing?.classifiedAt ?? new Date(),
  };

  await db
    .insert(classifications)
    .values(row)
    .onConflictDoUpdate({
      target: classifications.id,
      set: { lane, classifiedAt: new Date() },
    });

  const classification: Classification = {
    threadId,
    lane,
    priority: row.priority,
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
    classifiedAt: new Date(),
  };

  void broadcastInboxEvent(userId, {
    type: "classification-updated",
    threadId,
    classification,
  });

  return classification;
}
