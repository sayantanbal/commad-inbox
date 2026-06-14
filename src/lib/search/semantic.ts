import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { embedWithProvider } from "@/lib/ai/embed";
import type { AiProvider } from "@/lib/ai/providers";
import { db } from "@/lib/db";
import { classifications, users } from "@/lib/db/schema";

export type SearchHit = {
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  lane: string;
  priority: string;
  score: number;
};

function embeddingProviderFilter(provider: AiProvider) {
  if (provider === "gemini") {
    return or(
      eq(classifications.embeddingProvider, "gemini"),
      sql`${classifications.embeddingProvider} IS NULL`
    );
  }
  return eq(classifications.embeddingProvider, provider);
}

export async function semanticSearch(
  userId: string,
  query: string,
  limit = 20,
  provider: AiProvider = "gemini"
): Promise<SearchHit[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.backfillCompletedAt) {
    return [];
  }

  const { vector } = await embedWithProvider(userId, provider, query.trim());
  const literal = `[${vector.join(",")}]`;

  const rows = await db.execute<{
    thread_id: string;
    subject: string;
    sender: string;
    snippet: string;
    lane: string;
    priority: string;
    score: number;
  }>(sql`
    SELECT
      thread_id,
      subject,
      sender,
      snippet,
      lane::text AS lane,
      priority::text AS priority,
      (embedding <=> ${literal}::vector) AS score
    FROM classifications
    WHERE user_id = ${userId}
      AND embedding IS NOT NULL
      AND (
        embedding_provider = ${provider}
        OR (${provider} = 'gemini' AND embedding_provider IS NULL)
      )
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${limit}
  `);

  return rows.rows.map((row) => ({
    threadId: row.thread_id,
    subject: row.subject,
    sender: row.sender,
    snippet: row.snippet,
    lane: row.lane,
    priority: row.priority,
    score: Number(row.score),
  }));
}

export async function hasSearchableEmbeddings(
  userId: string,
  provider: AiProvider = "gemini"
): Promise<boolean> {
  const [row] = await db
    .select({ id: classifications.id })
    .from(classifications)
    .where(
      and(
        eq(classifications.userId, userId),
        isNotNull(classifications.embedding),
        embeddingProviderFilter(provider)
      )
    )
    .limit(1);
  return Boolean(row);
}
