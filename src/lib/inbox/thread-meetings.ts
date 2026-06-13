import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { threadMeetings } from "@/lib/db/schema";
import type { ThreadMeeting } from "@/lib/types";

function rowToMeeting(row: typeof threadMeetings.$inferSelect): ThreadMeeting {
  return {
    threadId: row.threadId,
    eventId: row.eventId,
    start: row.slotStart,
    durationMinutes: row.durationMinutes,
  };
}

export async function getThreadMeetingsForUser(userId: string): Promise<ThreadMeeting[]> {
  const rows = await db.select().from(threadMeetings).where(eq(threadMeetings.userId, userId));
  return rows.map(rowToMeeting);
}

export async function getThreadMeetingForThread(
  userId: string,
  threadId: string
): Promise<ThreadMeeting | null> {
  const rows = await db
    .select()
    .from(threadMeetings)
    .where(and(eq(threadMeetings.userId, userId), eq(threadMeetings.threadId, threadId)))
    .limit(1);

  return rows[0] ? rowToMeeting(rows[0]) : null;
}

export async function upsertThreadMeeting(
  userId: string,
  input: {
    threadId: string;
    eventId: string;
    slotStart: Date;
    durationMinutes: number;
  }
): Promise<ThreadMeeting> {
  const id = `${userId}:${input.threadId}`;
  await db
    .insert(threadMeetings)
    .values({
      id,
      userId,
      threadId: input.threadId,
      eventId: input.eventId,
      slotStart: input.slotStart,
      durationMinutes: input.durationMinutes,
    })
    .onConflictDoUpdate({
      target: threadMeetings.id,
      set: {
        eventId: input.eventId,
        slotStart: input.slotStart,
        durationMinutes: input.durationMinutes,
      },
    });

  return {
    threadId: input.threadId,
    eventId: input.eventId,
    start: input.slotStart,
    durationMinutes: input.durationMinutes,
  };
}

export async function deleteThreadMeeting(userId: string, threadId: string): Promise<boolean> {
  const result = await db
    .delete(threadMeetings)
    .where(and(eq(threadMeetings.userId, userId), eq(threadMeetings.threadId, threadId)))
    .returning({ id: threadMeetings.id });

  return result.length > 0;
}
