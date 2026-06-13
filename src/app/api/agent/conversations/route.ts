import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  createAgentConversation,
  listAgentConversations,
} from "@/lib/agent/conversations";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const conversations = await listAgentConversations(auth.userId);
  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

export async function POST() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const conversation = await createAgentConversation(auth.userId);
  return NextResponse.json({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
    },
  });
}
