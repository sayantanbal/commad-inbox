import { and, eq, isNotNull, sql } from "drizzle-orm";
import { geminiEmbed } from "@/lib/ai/gemini";
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

export async function semanticSearch(
  userId: string,
  query: string,
  limit = 20
): Promise<SearchHit[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.backfillCompletedAt) {
    return [];
  }

  const vector = await geminiEmbed(query.trim());
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

export async function hasSearchableEmbeddings(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: classifications.id })
    .from(classifications)
    .where(and(eq(classifications.userId, userId), isNotNull(classifications.embedding)))
    .limit(1);
  return Boolean(row);
}
