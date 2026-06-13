import { desc, eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { isPersistableAgentMessage } from "@/lib/agent/constants";
import { db } from "@/lib/db";
import { agentConversations, agentMessages } from "@/lib/db/schema";

export interface AgentConversationListItem {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
}

function titleFromMessages(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const textPart = firstUser.parts.find((p) => p.type === "text" && "text" in p);
  const text =
    textPart && typeof (textPart as { text?: string }).text === "string"
      ? (textPart as { text: string }).text.trim()
      : "";
  if (!text) return "New chat";
  return text.length > 48 ? `${text.slice(0, 45)}…` : text;
}

export async function listAgentConversations(userId: string): Promise<AgentConversationListItem[]> {
  const rows = await db
    .select({
      id: agentConversations.id,
      title: agentConversations.title,
      updatedAt: agentConversations.updatedAt,
      createdAt: agentConversations.createdAt,
    })
    .from(agentConversations)
    .where(eq(agentConversations.userId, userId))
    .orderBy(desc(agentConversations.updatedAt))
    .limit(50);

  return rows;
}

export async function createAgentConversation(userId: string): Promise<AgentConversationListItem> {
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(agentConversations).values({
    id,
    userId,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
  });
  return { id, title: "New chat", createdAt: now, updatedAt: now };
}

export async function getAgentConversationMessages(
  userId: string,
  conversationId: string
): Promise<UIMessage[] | null> {
  const [conversation] = await db
    .select({ id: agentConversations.id, userId: agentConversations.userId })
    .from(agentConversations)
    .where(eq(agentConversations.id, conversationId))
    .limit(1);

  if (!conversation || conversation.userId !== userId) return null;

  const rows = await db
    .select({
      id: agentMessages.id,
      role: agentMessages.role,
      parts: agentMessages.parts,
    })
    .from(agentMessages)
    .where(eq(agentMessages.conversationId, conversationId))
    .orderBy(agentMessages.createdAt);

  return rows.map((row) => ({
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: row.parts as UIMessage["parts"],
  }));
}

export async function replaceAgentConversationMessages(
  userId: string,
  conversationId: string,
  messages: UIMessage[]
): Promise<boolean> {
  const [conversation] = await db
    .select({ id: agentConversations.id, userId: agentConversations.userId })
    .from(agentConversations)
    .where(eq(agentConversations.id, conversationId))
    .limit(1);

  if (!conversation || conversation.userId !== userId) return false;

  const persistable = messages.filter(isPersistableAgentMessage);
  const title = titleFromMessages(persistable);
  const now = new Date();

  await db.delete(agentMessages).where(eq(agentMessages.conversationId, conversationId));

  if (persistable.length > 0) {
    await db.insert(agentMessages).values(
      persistable.map((message) => ({
        id: message.id,
        conversationId,
        role: message.role,
        parts: message.parts as unknown as Record<string, unknown>[],
        createdAt: now,
      }))
    );
  }

  await db
    .update(agentConversations)
    .set({ title, updatedAt: now })
    .where(eq(agentConversations.id, conversationId));

  return true;
}

export async function deleteAgentConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const result = await db
    .delete(agentConversations)
    .where(eq(agentConversations.id, conversationId))
    .returning({ id: agentConversations.id, userId: agentConversations.userId });

  const row = result[0];
  if (!row || row.userId !== userId) return false;
  return true;
}
