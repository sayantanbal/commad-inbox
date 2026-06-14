import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import type { ExtractedCommitment } from "@/lib/schemas/domain";
import { db } from "@/lib/db";
import { commitments } from "@/lib/db/schema";

function commitmentId(userId: string, threadId: string, messageId: string, index: number): string {
  return `${userId}:${threadId}:${messageId}:${index}`;
}

function statusForConfidence(confidence: number): "open" | "pending_confirm" {
  return confidence >= 0.6 ? "open" : "pending_confirm";
}

export async function persistExtractedCommitments(
  userId: string,
  threadId: string,
  messageId: string,
  extracted: ExtractedCommitment[]
): Promise<void> {
  if (extracted.length === 0) return;

  for (let i = 0; i < extracted.length; i++) {
    const item = extracted[i];
    const id = commitmentId(userId, threadId, messageId, i);
    await db
      .insert(commitments)
      .values({
        id,
        userId,
        threadId,
        messageId,
        direction: item.direction,
        text: item.text,
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        counterpartyEmail: item.counterpartyEmail,
        status: statusForConfidence(item.confidence),
        confidence: item.confidence,
        extractedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: commitments.id,
        set: {
          text: item.text,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          counterpartyEmail: item.counterpartyEmail,
          status: statusForConfidence(item.confidence),
          confidence: item.confidence,
          extractedAt: new Date(),
        },
      });
  }
}

export async function getCommitmentsForUser(
  userId: string,
  filter?: { direction?: "outbound" | "inbound"; status?: string[] }
) {
  const statuses = filter?.status ?? ["open", "pending_confirm"];
  const conditions = [eq(commitments.userId, userId), inArray(commitments.status, statuses as never[])];
  if (filter?.direction) {
    conditions.push(eq(commitments.direction, filter.direction));
  }
  return db
    .select()
    .from(commitments)
    .where(and(...conditions))
    .orderBy(commitments.dueDate);
}

export async function getCommitmentsForThread(userId: string, threadId: string) {
  return db
    .select()
    .from(commitments)
    .where(
      and(
        eq(commitments.userId, userId),
        eq(commitments.threadId, threadId),
        inArray(commitments.status, ["open", "pending_confirm"] as never[])
      )
    );
}

export async function updateCommitmentStatus(
  userId: string,
  commitmentId: string,
  status: "open" | "fulfilled" | "dismissed"
) {
  await db
    .update(commitments)
    .set({ status })
    .where(and(eq(commitments.id, commitmentId), eq(commitments.userId, userId)));
}

export async function confirmCommitment(userId: string, commitmentId: string) {
  await db
    .update(commitments)
    .set({ status: "open" })
    .where(
      and(
        eq(commitments.id, commitmentId),
        eq(commitments.userId, userId),
        eq(commitments.status, "pending_confirm")
      )
    );
}

export async function markFollowUpQueued(userId: string, commitmentId: string) {
  await db
    .update(commitments)
    .set({ followUpDraftQueuedAt: new Date() })
    .where(and(eq(commitments.id, commitmentId), eq(commitments.userId, userId)));
}

export function mapCommitmentRow(row: typeof commitments.$inferSelect) {
  return {
    id: row.id,
    threadId: row.threadId,
    messageId: row.messageId,
    direction: row.direction,
    text: row.text,
    dueDate: row.dueDate?.toISOString() ?? null,
    counterpartyEmail: row.counterpartyEmail,
    status: row.status,
    confidence: row.confidence,
    extractedAt: row.extractedAt.toISOString(),
  };
}

export async function extractAndPersistCommitmentsForThread(
  userId: string,
  userEmail: string,
  thread: {
    id: string;
    subject: string;
    messages: Array<{ id: string; from: { email: string }; body: string; timestamp: Date }>;
    participants: Array<{ email: string }>;
  },
  lane: string
): Promise<void> {
  if (lane === "fyi" || lane === "done") return;

  const latest = thread.messages.at(-1);
  if (!latest?.body) return;

  const { extractCommitmentsFromMessage } = await import("@/lib/commitments/extract");
  const extracted = await extractCommitmentsFromMessage({
    subject: thread.subject,
    body: latest.body,
    userEmail,
    senderEmail: latest.from.email,
    participants: thread.participants.map((p) => p.email),
  });

  await persistExtractedCommitments(userId, thread.id, latest.id, extracted);
}
