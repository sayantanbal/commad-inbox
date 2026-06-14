import "server-only";

import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { focusAutoReplies, userPreferences } from "@/lib/db/schema";
import type { WorkingDaysStructured } from "@/lib/preferences/sanitize-working-days";
import { sanitizeWorkingDaysText } from "@/lib/preferences/sanitize-working-days";

export async function getUserPreferences(userId: string) {
  const [row] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  if (row) return row;

  await db.insert(userPreferences).values({ userId }).onConflictDoNothing();
  const [created] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  return created!;
}

function localTimeString(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export function isWithinBatchWindow(
  windows: string[],
  timezone: string,
  now = new Date()
): boolean {
  const current = localTimeString(timezone, now);
  const [h, m] = current.split(":").map(Number);
  const minutesNow = h * 60 + m;

  for (const window of windows) {
    const [wh, wm] = window.split(":").map(Number);
    const start = wh * 60 + wm;
    const end = start + 60;
    if (minutesNow >= start && minutesNow < end) return true;
  }
  return false;
}

export async function isInFocusWindow(userId: string): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  if (!prefs.focusModeEnabled) return false;
  return isWithinBatchWindow(prefs.batchWindows, prefs.timezone);
}

export async function hasAutoRepliedToday(userId: string, senderEmail: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ id: focusAutoReplies.id })
    .from(focusAutoReplies)
    .where(
      and(
        eq(focusAutoReplies.userId, userId),
        eq(focusAutoReplies.senderEmail, senderEmail.toLowerCase()),
        gte(focusAutoReplies.sentAt, startOfDay)
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function logAutoReply(userId: string, senderEmail: string, threadId: string) {
  const { randomUUID } = await import("crypto");
  await db.insert(focusAutoReplies).values({
    id: randomUUID(),
    userId,
    senderEmail: senderEmail.toLowerCase(),
    threadId,
    sentAt: new Date(),
  });
}

export async function updateUserPreferences(
  userId: string,
  patch: Partial<{
    batchWindows: string[];
    focusModeEnabled: boolean;
    autoResponderTemplate: string;
    followUpDaysDefault: number;
    timezone: string;
    workingDaysStructured: WorkingDaysStructured | null;
    workingDaysTextOverride: string | null;
    workingDaysSource: "wizard" | "override";
    onboardingCompletedAt: Date | null;
  }>
) {
  await getUserPreferences(userId);

  const normalized = { ...patch };
  if ("workingDaysTextOverride" in patch) {
    normalized.workingDaysTextOverride =
      patch.workingDaysTextOverride == null
        ? null
        : sanitizeWorkingDaysText(patch.workingDaysTextOverride);
  }

  await db
    .update(userPreferences)
    .set({ ...normalized, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId));
}
