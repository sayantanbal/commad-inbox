import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function isBackfillComplete(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ backfillCompletedAt: users.backfillCompletedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(user?.backfillCompletedAt);
}
