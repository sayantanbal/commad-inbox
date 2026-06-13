import { classifyThread } from "@/lib/classifier/classify-thread";
import { embedWithProvider } from "@/lib/ai/embed";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { classificationEmbedText } from "@/lib/embeddings/classification-text";
import { storeClassificationEmbedding } from "@/lib/embeddings/store";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import type { CorsairInstance } from "@/lib/corsair";
import { db } from "@/lib/db";
import { classifications } from "@/lib/db/schema";
import type { Classification } from "@/lib/types";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";

function classificationId(userId: string, threadId: string): string {
  return `${userId}:${threadId}`;
}

function latestBody(thread: ReturnType<typeof mapGmailThread>): string {
  if (!thread?.messages.length) return thread?.snippet ?? "";
  return thread.messages.at(-1)?.body ?? thread.snippet;
}

export async function classifyThreadForUser(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  threadId: string
): Promise<Classification | null> {
  const full = await tenant.gmail.api.threads.get({ id: threadId, format: "full" });
  const thread = mapGmailThread(full);
  if (!thread) return null;

  const sender =
    thread.participants[0]?.name ?? thread.participants[0]?.email ?? "Unknown";
  const result = await classifyThread({
    subject: thread.subject,
    sender,
    snippet: thread.snippet,
    body: latestBody(thread),
  });

  const row = {
    id: classificationId(userId, threadId),
    userId,
    threadId,
    priority: result.priority,
    lane: result.lane,
    subject: thread.subject,
    sender,
    snippet: thread.snippet,
    schedulingIntent: result.schedulingIntent,
    classifiedAt: new Date(),
  };

  await db
    .insert(classifications)
    .values(row)
    .onConflictDoUpdate({
      target: classifications.id,
      set: {
        priority: row.priority,
        lane: row.lane,
        subject: row.subject,
        sender: row.sender,
        snippet: row.snippet,
        schedulingIntent: row.schedulingIntent,
        classifiedAt: row.classifiedAt,
      },
    });

  void embedClassificationAsync(userId, threadId, thread.subject, sender, thread.snippet);

  const classification: Classification = {
    threadId,
    priority: result.priority,
    lane: result.lane,
    subject: thread.subject,
    sender,
    snippet: thread.snippet,
    schedulingIntent: result.schedulingIntent
      ? {
          proposedTimes: result.schedulingIntent.proposedTimes.map((t) => new Date(t)),
          attendees: result.schedulingIntent.attendees,
          duration: result.schedulingIntent.duration,
          confidence: result.schedulingIntent.confidence,
        }
      : null,
    classifiedAt: row.classifiedAt,
  };

  await broadcastInboxEvent(userId, {
    type: "classification-updated",
    threadId,
    classification,
  });

  return classification;
}

async function embedClassificationAsync(
  userId: string,
  threadId: string,
  subject: string,
  sender: string,
  snippet: string
): Promise<void> {
  try {
    const { vector, provider } = await embedWithProvider(
      getDefaultProvider(),
      classificationEmbedText(subject, sender, snippet)
    );
    await storeClassificationEmbedding(userId, threadId, vector, provider);
  } catch (error) {
    console.error("[embed] failed for thread", threadId, error);
  }
}
