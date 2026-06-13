import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { snoozes } from "@/lib/db/schema";

export interface StoredSnooze {
  threadId: string;
  until: Date;
}

export async function getSnoozesForUser(userId: string): Promise<StoredSnooze[]> {
  const now = new Date();
  const rows = await db.select().from(snoozes).where(eq(snoozes.userId, userId));

  return rows
    .filter((row) => row.snoozedUntil > now)
    .map((row) => ({ threadId: row.threadId, until: row.snoozedUntil }));
}

export async function snoozeThreadForUser(
  userId: string,
  threadId: string,
  until: Date
): Promise<void> {
  const id = `${userId}:${threadId}`;
  await db
    .insert(snoozes)
    .values({ id, userId, threadId, snoozedUntil: until })
    .onConflictDoUpdate({
      target: snoozes.id,
      set: { snoozedUntil: until },
    });
}

export async function unsnoozeThreadForUser(userId: string, threadId: string): Promise<void> {
  await db.delete(snoozes).where(and(eq(snoozes.userId, userId), eq(snoozes.threadId, threadId)));
}

export async function expireSnoozes(now = new Date()): Promise<string[]> {
  const expired = await db
    .select({ userId: snoozes.userId, threadId: snoozes.threadId })
    .from(snoozes)
    .where(lte(snoozes.snoozedUntil, now));

  if (expired.length === 0) return [];

  await db.delete(snoozes).where(lte(snoozes.snoozedUntil, now));
  return expired.map((row) => row.threadId);
}
