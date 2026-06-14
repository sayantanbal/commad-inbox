import { eq } from "drizzle-orm";
import {
  inferLaneFromThread,
  inferPriorityFromThread,
} from "@/lib/classifier/infer-lane";
import { db } from "@/lib/db";
import { classifications } from "@/lib/db/schema";
import type { Classification, Thread, TriageLane } from "@/lib/types";

export type DefaultClassificationOptions = {
  meetingThreadIds?: ReadonlySet<string>;
};

function withMeetingLane(classification: Classification, hasMeeting: boolean): Classification {
  if (hasMeeting && classification.lane !== "done") {
    return { ...classification, lane: "done" };
  }
  return classification;
}

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
  options?: DefaultClassificationOptions
): Classification[] {
  const byThreadId = new Map(existing.map((item) => [item.threadId, item]));
  const meetingThreadIds = options?.meetingThreadIds;

  return threads.map((thread) => {
    const hasMeeting = meetingThreadIds?.has(thread.id) ?? false;
    const stored = byThreadId.get(thread.id);
    if (stored) {
      return withMeetingLane(stored, hasMeeting);
    }

    // Inbox fetch is capped to the backfill window — always show threads even if
    // AI classification failed (e.g. Gemini quota). DB rows replace defaults when present.
    const sender = thread.participants[0]?.name ?? thread.participants[0]?.email ?? "Unknown";
    const lane = hasMeeting ? "done" : inferLaneFromThread({
      subject: thread.subject,
      snippet: thread.snippet,
      sender,
    });
    const priority = inferPriorityFromThread({
      subject: thread.subject,
      snippet: thread.snippet,
      lane,
    });

    return {
      threadId: thread.id,
      priority,
      lane,
      subject: thread.subject,
      sender,
      snippet: thread.snippet,
      schedulingIntent: null,
      classifiedAt: thread.timestamp,
    };
  });
}

