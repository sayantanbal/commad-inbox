import { sql } from "drizzle-orm";
import { classifyThread } from "@/lib/classifier/classify-thread";
import { geminiEmbed } from "@/lib/ai/gemini";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import type { CorsairInstance } from "@/lib/corsair";
import { db } from "@/lib/db";
import { classifications } from "@/lib/db/schema";
import type { Classification } from "@/lib/types";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";

function classificationId(userId: string, threadId: string): string {
  return `${userId}:${threadId}`;
}

function embedText(subject: string, sender: string, snippet: string): string {
  return `${subject}\n${sender}\n${snippet}`.trim();
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
    const vector = await geminiEmbed(embedText(subject, sender, snippet));
    const literal = `[${vector.join(",")}]`;
    await db.execute(sql`
      UPDATE classifications
      SET embedding = ${literal}::vector
      WHERE user_id = ${userId} AND thread_id = ${threadId}
    `);
  } catch (error) {
    console.error("[embed] failed for thread", threadId, error);
  }
}
