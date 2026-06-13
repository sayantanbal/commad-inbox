import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { AiProvider } from "@/lib/ai/providers";

export async function storeClassificationEmbedding(
  userId: string,
  threadId: string,
  vector: number[],
  provider: AiProvider
): Promise<void> {
  const literal = `[${vector.join(",")}]`;
  await db.execute(sql`
    UPDATE classifications
    SET embedding = ${literal}::vector,
        embedding_provider = ${provider}
    WHERE user_id = ${userId} AND thread_id = ${threadId}
  `);
}
