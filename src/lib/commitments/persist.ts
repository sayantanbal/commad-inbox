import "server-only";

import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import type { CorsairInstance } from "@/lib/corsair";
import { extractAndPersistCommitmentsForThread } from "@/lib/commitments/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function extractCommitmentsForUser(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  threadId: string,
  lane: string
): Promise<void> {
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
  if (!user?.email) return;

  const full = await tenant.gmail.api.threads.get({ id: threadId, format: "full" });
  const thread = mapGmailThread(full);
  if (!thread) return;

  await extractAndPersistCommitmentsForThread(userId, user.email, thread, lane);
}
