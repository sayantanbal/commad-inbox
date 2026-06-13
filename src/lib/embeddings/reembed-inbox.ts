import { and, eq, isNull, or } from "drizzle-orm";
import { embedWithProvider } from "@/lib/ai/embed";
import type { AiProvider } from "@/lib/ai/providers";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { classificationEmbedText } from "@/lib/embeddings/classification-text";
import { storeClassificationEmbedding } from "@/lib/embeddings/store";
import { db } from "@/lib/db";
import { classifications } from "@/lib/db/schema";
import { broadcastInboxEvent } from "@/lib/realtime/pusher";

type ClassificationRow = {
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
};

const activeJobs = new Set<string>();

function jobKey(userId: string, provider: AiProvider): string {
  return `${userId}:${provider}`;
}

export function isReembedRunning(userId: string, provider: AiProvider): boolean {
  return activeJobs.has(jobKey(userId, provider));
}

export async function countRowsNeedingReembed(
  userId: string,
  provider: AiProvider
): Promise<number> {
  const rows = await listRowsNeedingReembed(userId, provider);
  return rows.length;
}

async function listRowsNeedingReembed(
  userId: string,
  provider: AiProvider
): Promise<ClassificationRow[]> {
  if (provider === "openai") {
    return db
      .select({
        threadId: classifications.threadId,
        subject: classifications.subject,
        sender: classifications.sender,
        snippet: classifications.snippet,
      })
      .from(classifications)
      .where(
        and(
          eq(classifications.userId, userId),
          or(
            isNull(classifications.embeddingProvider),
            eq(classifications.embeddingProvider, "gemini")
          )
        )
      );
  }

  return db
    .select({
      threadId: classifications.threadId,
      subject: classifications.subject,
      sender: classifications.sender,
      snippet: classifications.snippet,
    })
    .from(classifications)
    .where(
      and(eq(classifications.userId, userId), eq(classifications.embeddingProvider, "openai"))
    );
}

export async function runReembedInbox(userId: string, provider: AiProvider): Promise<void> {
  const rows = await listRowsNeedingReembed(userId, provider);
  const total = rows.length;
  if (total === 0) {
    await broadcastInboxEvent(userId, { type: "reembed-complete", provider, total: 0 });
    return;
  }

  let completed = 0;

  for (const row of rows) {
    try {
      const { vector, provider: usedProvider } = await embedWithProvider(
        provider,
        classificationEmbedText(row.subject, row.sender, row.snippet)
      );
      await storeClassificationEmbedding(userId, row.threadId, vector, usedProvider);
    } catch (error) {
      if (isRateLimitError(error)) {
        console.warn("[reembed] AI quota exhausted — pausing re-embed job");
        break;
      }
      console.error("[reembed] failed for thread", row.threadId, error);
    }

    completed += 1;
    await broadcastInboxEvent(userId, {
      type: "reembed-progress",
      provider,
      completed,
      total,
    });
    await sleep(400);
  }

  await broadcastInboxEvent(userId, {
    type: "reembed-complete",
    provider,
    total,
    completed,
  });
}

export function triggerReembedInbox(userId: string, provider: AiProvider): "started" | "running" {
  const key = jobKey(userId, provider);
  if (activeJobs.has(key)) {
    return "running";
  }

  activeJobs.add(key);
  void runReembedInbox(userId, provider)
    .catch((error) => {
      console.error("[reembed] job failed for user", userId, error);
    })
    .finally(() => {
      activeJobs.delete(key);
    });

  return "started";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
