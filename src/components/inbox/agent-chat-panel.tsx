"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { Bot, Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentToolApproval } from "@/components/inbox/agent-tool-approval";
import { AiProviderSelect } from "@/components/inbox/ai-provider-select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAlternateProvider } from "@/lib/ai/alternate-provider";
import { AI_PROVIDER_CONFIG } from "@/lib/ai/providers";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { useAiProvider } from "@/hooks/use-ai-provider";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPT =
  'Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it';

const starterMessages: UIMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `Try: "${EXAMPLE_PROMPT}"`,
      },
    ],
  },
];

type ToolPart = ToolUIPart | DynamicToolUIPart;

function isTextPart(part: UIMessage["parts"][number]): part is { type: "text"; text: string } {
  return part.type === "text" && "text" in part;
}

function renderToolPart(
  part: ToolPart,
  addToolApprovalResponse: ReturnType<typeof useChat>["addToolApprovalResponse"]
) {
  const toolName = getToolName(part);

  if (part.state === "approval-requested" && part.approval?.id) {
    return (
      <AgentToolApproval
        key={part.toolCallId}
        part={part}
        onApprove={(id) => addToolApprovalResponse({ id, approved: true })}
        onDeny={(id) =>
          addToolApprovalResponse({
            id,
            approved: false,
            reason: "User declined this action",
          })
        }
      />
    );
  }

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div
        key={part.toolCallId}
        className="mr-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      >
        Running {toolName}…
      </div>
    );
  }

  if (part.state === "output-available") {
    return (
      <details
        key={part.toolCallId}
        className="mr-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
      >
        <summary className="cursor-pointer text-muted-foreground">{toolName} completed</summary>
        <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-foreground/80">
          {typeof part.output === "string"
            ? part.output
            : JSON.stringify(part.output, null, 2)}
        </pre>
      </details>
    );
  }

  if (part.state === "output-error") {
    return (
      <div
        key={part.toolCallId}
        className="mr-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      >
        {part.errorText ?? "Tool failed"}
      </div>
    );
  }

  if (part.state === "output-denied") {
    return (
      <div
        key={part.toolCallId}
        className="mr-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
      >
        {toolName} declined
      </div>
    );
  }

  return null;
}

export function AgentChatPanel() {
  const [input, setInput] = useState("");
  const { provider, setProvider } = useAiProvider();
  const providerRef = useRef(provider);
  const lastUserTextRef = useRef<string | null>(null);
  const fallbackAttemptRef = useRef(false);

  providerRef.current = provider;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent/chat",
        prepareSendMessagesRequest: ({ messages, body, ...rest }) => ({
          ...rest,
          body: {
            ...body,
            messages,
            provider: providerRef.current,
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, addToolApprovalResponse, status, error } = useChat({
    transport,
    messages: starterMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!error || fallbackAttemptRef.current || isBusy) return;
    if (!isRateLimitError(error)) return;

    const alternate = getAlternateProvider(provider);
    if (!alternate) return;

    fallbackAttemptRef.current = true;
    setProvider(alternate);

    const lastText = lastUserTextRef.current;
    if (lastText) {
      void sendMessage({ text: lastText });
    }
  }, [error, isBusy, provider, sendMessage, setProvider]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    lastUserTextRef.current = text;
    fallbackAttemptRef.current = false;
    void sendMessage({ text });
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Bot className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">Agent</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {AI_PROVIDER_CONFIG[provider].chatLabel} · auto-fallback on rate limits
          </p>
        </div>
        {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.parts.map((part, index) => {
                if (isTextPart(part) && part.text.trim()) {
                  return (
                    <div
                      key={`${message.id}-text-${index}`}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                        message.role === "user"
                          ? "ml-6 bg-primary/15 text-foreground"
                          : "mr-2 bg-secondary text-secondary-foreground"
                      )}
                    >
                      {part.text}
                    </div>
                  );
                }

                if (isToolUIPart(part)) {
                  return renderToolPart(part, addToolApprovalResponse);
                }

                return null;
              })}
            </div>
          ))}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error.message}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <AiProviderSelect value={provider} onChange={setProvider} disabled={isBusy} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask the agent…"
            disabled={isBusy}
            className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <Button size="icon" onClick={handleSend} disabled={isBusy || !input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <button
          type="button"
          className="mt-1.5 w-full truncate text-left text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => setInput(EXAMPLE_PROMPT)}
        >
          Example: {EXAMPLE_PROMPT}
        </button>
      </div>
    </div>
  );
}
