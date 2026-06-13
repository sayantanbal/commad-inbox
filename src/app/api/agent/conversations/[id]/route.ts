import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  deleteAgentConversation,
  getAgentConversationMessages,
  replaceAgentConversationMessages,
} from "@/lib/agent/conversations";
import { saveConversationBodySchema } from "@/lib/schemas/api";
import type { UIMessage } from "ai";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const messages = await getAgentConversationMessages(auth.userId, id);
  if (messages === null) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ messages });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, saveConversationBodySchema);
  if (!parsed.ok) return parsed.response;

  const { id } = await params;
  const saved = await replaceAgentConversationMessages(
    auth.userId,
    id,
    parsed.data.messages as UIMessage[]
  );

  if (!saved) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const deleted = await deleteAgentConversation(auth.userId, id);
  if (!deleted) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
