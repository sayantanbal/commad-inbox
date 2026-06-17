import "server-only";

import { addBusinessDays } from "date-fns";
import { and, eq, isNull } from "drizzle-orm";
import { generateFollowUpDraftHtml } from "@/lib/commitments/generate-follow-up";
import { saveFollowUpDraft } from "@/lib/commitments/follow-up-draft";
import { db } from "@/lib/db";
import { commitments } from "@/lib/db/schema";
import { getUserPreferences } from "@/lib/focus/window";

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

    try {
      const draftHtml = await generateFollowUpDraftHtml(userId, {
        text: row.text,
        counterpartyEmail: row.counterpartyEmail,
        followUpDaysDefault: prefs.followUpDaysDefault,
      });
      await saveFollowUpDraft(userId, row.id, draftHtml);
      queued++;
      console.info(`[follow-up] saved draft for ${row.id}`, draftHtml.slice(0, 80));
    } catch (error) {
      console.error("[follow-up] failed for", row.id, error);
    }
  }
  return queued;
}
