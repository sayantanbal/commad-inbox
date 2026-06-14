import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { threadSummaries } from "@/lib/db/schema";
import { generateJsonWithProvider } from "@/lib/ai/generate";
import type { AiProvider } from "@/lib/ai/providers";
import { aiSummarySchema, type AiSummary, type SuggestedAction } from "@/lib/schemas/domain";
import type { Classification, Thread } from "@/lib/types";

export async function getCachedThreadSummary(
  userId: string,
  threadId: string,
  messageCount: number
): Promise<AiSummary | null> {
  try {
    const [row] = await db
      .select()
      .from(threadSummaries)
      .where(and(eq(threadSummaries.userId, userId), eq(threadSummaries.threadId, threadId)))
      .limit(1);

    if (!row || row.messageCount !== messageCount) return null;

    const parsed = aiSummarySchema.safeParse({
      bullets: row.bullets,
      actions: row.actions,
    });
    if (!parsed.success) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

export async function saveThreadSummary(
  userId: string,
  threadId: string,
  messageCount: number,
  summary: AiSummary,
  provider: AiProvider
): Promise<void> {
  const existing = await db
    .select({ id: threadSummaries.id })
    .from(threadSummaries)
    .where(and(eq(threadSummaries.userId, userId), eq(threadSummaries.threadId, threadId)))
    .limit(1);

  const now = new Date();
  const values = {
    bullets: summary.bullets,
    actions: summary.actions as SuggestedAction[],
    messageCount,
    provider,
    updatedAt: now,
  };

  if (existing[0]) {
    await db.update(threadSummaries).set(values).where(eq(threadSummaries.id, existing[0].id));
    return;
  }

  await db.insert(threadSummaries).values({
    id: crypto.randomUUID(),
    userId,
    threadId,
    ...values,
  });
}

const THREAD_SUMMARY_SYSTEM = `You summarize email threads for a busy professional inbox.
Return concise bullet points (max 4) covering: what the thread is about, what's blocking or due, and any dates mentioned.
Suggest 2-3 short action chips the user might take next. Action types:
- reply: open reply composer
- archive: archive when done
- schedule: schedule a meeting (scheduling threads)
- snooze: defer for later
- compose: open composer with optional draftText
- open_thread: focus thread (only if needed)

Always include threadId on actions that apply to this thread. Labels should be short (under 40 chars), like "Looks good — signing today".`;

function formatThreadForPrompt(thread: Thread, classification: Classification | undefined): string {
  const recent = thread.messages.slice(-6);
  const bodies = recent
    .map(
      (m) =>
        `From: ${m.from.email}\nDate: ${m.timestamp.toISOString()}\n${m.body.slice(0, 1500)}`
    )
    .join("\n---\n");

  return [
    `Thread ID: ${thread.id}`,
    `Subject: ${thread.subject}`,
    `Lane: ${classification?.lane ?? "unknown"}`,
    `Priority: ${classification?.priority ?? "medium"}`,
    `Participants: ${thread.participants.map((p) => p.email).join(", ")}`,
    `Messages:\n${bodies}`,
  ].join("\n");
}

export async function generateThreadSummary(
  thread: Thread,
  classification: Classification | undefined,
  provider: AiProvider
) {
  const prompt = formatThreadForPrompt(thread, classification);
  const { data, provider: used } = await generateJsonWithProvider(
    provider,
    prompt,
    `${THREAD_SUMMARY_SYSTEM}\n\nThread id for actions: ${thread.id}`,
    aiSummarySchema
  );

  const actions = data.actions.map((action) => ({
    ...action,
    threadId: action.threadId ?? thread.id,
  }));

  return { summary: { bullets: data.bullets, actions }, provider: used };
}
