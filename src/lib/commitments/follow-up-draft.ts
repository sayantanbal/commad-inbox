import "server-only";

import { and, eq } from "drizzle-orm";
import { generateFollowUpDraftHtml } from "@/lib/commitments/generate-follow-up";
import { db } from "@/lib/db";
import { commitments } from "@/lib/db/schema";

export async function getCommitmentById(userId: string, commitmentId: string) {
  const [row] = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.id, commitmentId), eq(commitments.userId, userId)));
  return row ?? null;
}

export async function saveFollowUpDraft(userId: string, commitmentId: string, draftHtml: string) {
  await db
    .update(commitments)
    .set({
      followUpDraftHtml: draftHtml,
      followUpDraftQueuedAt: new Date(),
    })
    .where(and(eq(commitments.id, commitmentId), eq(commitments.userId, userId)));
}

/** Returns persisted draft or generates, saves, and returns new HTML. */
export async function ensureFollowUpDraft(userId: string, commitmentId: string): Promise<{
  draftHtml: string;
  threadId: string;
  counterpartyEmail: string;
  generated: boolean;
}> {
  const row = await getCommitmentById(userId, commitmentId);
  if (!row) {
    throw new Error("Commitment not found");
  }
  if (row.direction !== "inbound") {
    throw new Error("Follow-up drafts are only for inbound (waiting) commitments");
  }
  if (!["open", "pending_confirm"].includes(row.status)) {
    throw new Error("Commitment is not open");
  }

  if (row.followUpDraftHtml?.trim()) {
    return {
      draftHtml: row.followUpDraftHtml,
      threadId: row.threadId,
      counterpartyEmail: row.counterpartyEmail,
      generated: false,
    };
  }

  const draftHtml = await generateFollowUpDraftHtml(userId, {
    text: row.text,
    counterpartyEmail: row.counterpartyEmail,
  });
  await saveFollowUpDraft(userId, commitmentId, draftHtml);

  return {
    draftHtml,
    threadId: row.threadId,
    counterpartyEmail: row.counterpartyEmail,
    generated: true,
  };
}
