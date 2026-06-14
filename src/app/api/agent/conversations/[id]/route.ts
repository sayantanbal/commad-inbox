import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  deleteAgentConversation,
  getAgentConversationMessages,
  replaceAgentConversationMessages,
} from "@/lib/agent/conversations";
import { conversationIdParamSchema, saveConversationBodySchema } from "@/lib/schemas/api";
import type { UIMessage } from "ai";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseConversationId(id: string) {
  return conversationIdParamSchema.safeParse(id);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const idParsed = parseConversationId(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const messages = await getAgentConversationMessages(auth.userId, idParsed.data);
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
  const idParsed = parseConversationId(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const saved = await replaceAgentConversationMessages(
    auth.userId,
    idParsed.data,
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
  const idParsed = parseConversationId(id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const deleted = await deleteAgentConversation(auth.userId, idParsed.data);
  if (!deleted) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
