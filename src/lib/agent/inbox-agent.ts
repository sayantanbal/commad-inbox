import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type LanguageModel,
  type ToolSet,
  type UIMessage,
} from "ai";
import type { OutboundAttachmentMeta } from "@/lib/gmail/outbound-attachment";
import { buildAgentSystemPrompt, type OpenThreadAttachmentContext } from "@/lib/agent/system-prompt";

export const INBOX_AGENT_MAX_STEPS = 8;

export type InboxAgentStreamParams = {
  model: LanguageModel;
  userEmail: string;
  messages: UIMessage[];
  tools: ToolSet;
  mentionContext?: Array<{ email: string; displayName: string }>;
  stagedAttachments?: OutboundAttachmentMeta[];
  openThread?: OpenThreadAttachmentContext | null;
};

export async function createInboxAgentStream(params: InboxAgentStreamParams) {
  const {
    model,
    userEmail,
    messages,
    tools,
    mentionContext,
    stagedAttachments,
    openThread,
  } = params;

  return streamText({
    model,
    system: buildAgentSystemPrompt(userEmail, mentionContext, stagedAttachments, openThread),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(INBOX_AGENT_MAX_STEPS),
  });
}
