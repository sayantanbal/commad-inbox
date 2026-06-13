import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { resolveAgentModelProvider } from "@/lib/ai/with-fallback";
import { getChatModel } from "@/lib/ai/models";
import { agentStreamErrorHandler } from "@/lib/agent/error-handler";
import { buildAgentMcpTools } from "@/lib/agent/mcp-tools";
import { buildAgentSystemPrompt } from "@/lib/agent/system-prompt";
import { NoAiProviderError } from "@/lib/ai/with-fallback";
import { assertPhase2Env } from "@/lib/env";
import { agentChatBodySchema } from "@/lib/schemas/api";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, agentChatBodySchema);
  if (!parsed.ok) return parsed.response;

  const messages = parsed.data.messages as UIMessage[];
  const provider = parsed.data.provider;

  try {
    const tools = buildAgentMcpTools(auth.tenant, auth.userId, auth.userEmail);
    const activeProvider = resolveAgentModelProvider(provider);
    const model = getChatModel(activeProvider);
    if (!model) {
      throw new NoAiProviderError();
    }

    const result = streamText({
      model,
      system: buildAgentSystemPrompt(auth.userEmail),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse({
      onError: agentStreamErrorHandler,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
