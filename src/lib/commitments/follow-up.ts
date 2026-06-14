import "server-only";

import { addBusinessDays } from "date-fns";
import { and, eq, isNull } from "drizzle-orm";
import { generateTextWithProvider } from "@/lib/ai/generate";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { markFollowUpQueued } from "@/lib/commitments/queries";
import { db } from "@/lib/db";
import { commitments } from "@/lib/db/schema";
import { getUserPreferences } from "@/lib/focus/window";

const FOLLOW_UP_SYSTEM = `Write a brief, professional follow-up email body (HTML with <p> tags only).
The other party promised something but has not replied. Reference the commitment naturally. 2-3 sentences max.`;

export async function processCommitmentFollowUps(
  userId: string,
  _userEmail: string
): Promise<number> {
  const prefs = await getUserPreferences(userId);
  const cutoff = addBusinessDays(new Date(), -prefs.followUpDaysDefault);

  const rows = await db
    .select()
    .from(commitments)
    .where(
      and(
        eq(commitments.userId, userId),
        eq(commitments.direction, "inbound"),
        eq(commitments.status, "open"),
        isNull(commitments.followUpDraftQueuedAt)
      )
    );

  let queued = 0;
  for (const row of rows) {
    if (row.extractedAt > cutoff) continue;

    const prompt = `Commitment: "${row.text}"\nCounterparty: ${row.counterpartyEmail}\nDays waiting: ${prefs.followUpDaysDefault}`;
    try {
      const { text } = await generateTextWithProvider(getDefaultProvider(), prompt, FOLLOW_UP_SYSTEM);
      await markFollowUpQueued(userId, row.id);
      queued++;
      console.info(`[follow-up] queued draft for ${row.id}`, text.slice(0, 80));
    } catch (error) {
      console.error("[follow-up] failed for", row.id, error);
    }
  }
  return queued;
}
