import "server-only";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyBriefs } from "@/lib/db/schema";
import { dailyBriefSchema, type DailyBrief } from "@/lib/schemas/domain";
import type { AiProvider } from "@/lib/ai/providers";
import type { CalendarEvent, Classification, Thread } from "@/lib/types";

export function computeBriefSourceHash(
  threads: Thread[],
  classifications: Classification[],
  events: CalendarEvent[]
): string {
  const payload = [
    threads.length,
    ...threads.slice(0, 30).map((t) => `${t.id}:${t.messages.length}:${t.timestamp.toISOString()}`),
    classifications.length,
    ...classifications.slice(0, 30).map((c) => `${c.threadId}:${c.lane}:${c.classifiedAt.toISOString()}`),
    events.length,
    ...events.slice(0, 40).map((e) => `${e.id}:${e.start.toISOString()}:${e.end.toISOString()}`),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

export async function getCachedDailyBrief(
  userId: string,
  sourceHash: string
): Promise<{ brief: DailyBrief; provider: AiProvider | null } | null> {
  try {
    const [row] = await db
      .select()
      .from(dailyBriefs)
      .where(eq(dailyBriefs.userId, userId))
      .limit(1);

    if (!row || row.sourceHash !== sourceHash) return null;

    const parsed = dailyBriefSchema.safeParse(row.brief);
    if (!parsed.success) return null;

    return {
      brief: parsed.data,
      provider: row.provider,
    };
  } catch {
    return null;
  }
}

export async function saveDailyBriefCache(
  userId: string,
  sourceHash: string,
  brief: DailyBrief,
  provider: AiProvider
): Promise<void> {
  const existing = await db
    .select({ id: dailyBriefs.id })
    .from(dailyBriefs)
    .where(eq(dailyBriefs.userId, userId))
    .limit(1);

  const values = {
    brief,
    sourceHash,
    provider,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db.update(dailyBriefs).set(values).where(eq(dailyBriefs.id, existing[0].id));
    return;
  }

  await db.insert(dailyBriefs).values({
    id: crypto.randomUUID(),
    userId,
    ...values,
  });
}

export async function invalidateDailyBriefCache(userId: string): Promise<void> {
  try {
    await db.delete(dailyBriefs).where(eq(dailyBriefs.userId, userId));
  } catch {
    /* table may not exist yet during migration */
  }
}
