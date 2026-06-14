import "server-only";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailSnippets } from "@/lib/db/schema";
import { DEFAULT_SNIPPETS } from "@/lib/snippets/defaults";

export { resolveSnippetVariables } from "@/lib/snippets/variables";

export async function seedDefaultSnippets(userId: string): Promise<void> {
  const existing = await db
    .select({ id: emailSnippets.id })
    .from(emailSnippets)
    .where(eq(emailSnippets.userId, userId))
    .limit(1);
  if (existing.length > 0) return;

  for (const snippet of DEFAULT_SNIPPETS) {
    await db.insert(emailSnippets).values({
      id: randomUUID(),
      userId,
      name: snippet.name,
      body: snippet.body,
      variables: [...snippet.variables],
    });
  }
}

export async function listSnippetsForUser(userId: string) {
  return db.select().from(emailSnippets).where(eq(emailSnippets.userId, userId));
}

export async function createSnippet(userId: string, name: string, body: string) {
  const variables = [...body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1].toLowerCase());
  const id = randomUUID();
  await db.insert(emailSnippets).values({
    id,
    userId,
    name,
    body,
    variables: [...new Set(variables)],
  });
  return id;
}

export async function deleteSnippet(userId: string, snippetId: string) {
  await db
    .delete(emailSnippets)
    .where(and(eq(emailSnippets.id, snippetId), eq(emailSnippets.userId, userId)));
}
