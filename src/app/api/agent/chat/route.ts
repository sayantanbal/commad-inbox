import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { enforceUserRateLimit } from "@/lib/api/user-rate-limit";
import { resolveAgentModelProvider } from "@/lib/ai/with-fallback";
import { getChatModel } from "@/lib/ai/models";
import { resolveApiKey } from "@/lib/ai/key-store";
import { agentStreamErrorHandler } from "@/lib/agent/error-handler";
import { buildAgentMcpTools } from "@/lib/agent/mcp-tools";
import { buildAgentSystemPrompt } from "@/lib/agent/system-prompt";
import { NoAiProviderError } from "@/lib/ai/with-fallback";
import { assertAiAvailable } from "@/lib/ai/runtime";
import { aiErrorResponse } from "@/lib/api/ai-error-response";
import { agentChatBodySchema } from "@/lib/schemas/api";
import { listOutboundAttachmentMeta } from "@/lib/gmail/outbound-attachment";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = enforceUserRateLimit(auth.userId, "agent-chat");
  if (rateLimited) return rateLimited;

  try {
    await assertAiAvailable(auth.userId);
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, agentChatBodySchema);
  if (!parsed.ok) return parsed.response;

  const messages = parsed.data.messages as UIMessage[];
  const provider = parsed.data.provider;

  try {
    const mentionContext = parsed.data.mentionedContacts ?? [];
    const pendingIds = parsed.data.pendingAttachmentIds ?? [];
    const stagedAttachments =
      pendingIds.length > 0
        ? await listOutboundAttachmentMeta(auth.userId, pendingIds)
        : [];
    const tools = buildAgentMcpTools(auth.tenant, auth.userId, auth.userEmail);
    const activeProvider = await resolveAgentModelProvider(auth.userId, provider);
    const apiKey = await resolveApiKey(auth.userId, activeProvider);
    if (!apiKey) {
      throw new NoAiProviderError();
    }

    const model = getChatModel(activeProvider, apiKey);
    if (!model) {
      throw new NoAiProviderError();
    }

    const result = streamText({
      model,
      system: buildAgentSystemPrompt(
        auth.userEmail,
        mentionContext,
        stagedAttachments,
        parsed.data.openThread ?? null
      ),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse({
      onError: agentStreamErrorHandler,
    });
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "Agent request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
