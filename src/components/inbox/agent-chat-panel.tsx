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
import { Bot, CalendarRange, Clock, Inbox, Loader2, Plus, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentToolApproval } from "@/components/inbox/agent-tool-approval";
import { AttachmentStaging } from "@/components/inbox/attachment-staging";
import { AgentMentionInput, type MentionContact } from "@/components/inbox/agent-mention-input";
import { AiProviderSelect } from "@/components/inbox/ai-provider-select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAlternateProvider } from "@/lib/ai/alternate-provider";
import { AI_PROVIDER_CONFIG } from "@/lib/ai/providers";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { useAiProvider } from "@/hooks/use-ai-provider";
import {
  createAgentConversationApi,
  listAgentConversationsApi,
  loadAgentConversationApi,
  saveAgentConversationApi,
  type AgentConversationItem,
  type OutboundAttachmentMeta,
} from "@/lib/inbox/client-api";
import { WELCOME_MESSAGE_ID } from "@/lib/agent/constants";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPT =
  'Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it';

function welcomeMessage(): UIMessage {
  return {
    id: WELCOME_MESSAGE_ID,
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `I help with Gmail and Google Calendar — sending mail, scheduling invites, and inbox coordination.\n\nTry: "${EXAMPLE_PROMPT}"`,
      },
    ],
  };
}

type ToolPart = ToolUIPart | DynamicToolUIPart;

function isTextPart(part: UIMessage["parts"][number]): part is { type: "text"; text: string } {
  return part.type === "text" && "text" in part;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function renderToolPart(
  part: ToolPart,
  addToolApprovalResponse: ReturnType<typeof useChat>["addToolApprovalResponse"],
  onEdit?: (toolName: string, input: Record<string, unknown>) => void,
  onToolApproved?: (toolName: string, input: Record<string, unknown>) => void,
  shouldBridgeInviteToInbox?: (input: Record<string, unknown>) => boolean
) {
  const toolName = getToolName(part);

  if (part.state === "approval-requested" && part.approval?.id) {
    return (
      <AgentToolApproval
        key={part.toolCallId}
        shouldBridgeInviteToInbox={shouldBridgeInviteToInbox}
        part={part}
        onApprove={(id) => {
          if (part.input && typeof part.input === "object") {
            onToolApproved?.(toolName, part.input as Record<string, unknown>);
          }
          addToolApprovalResponse({ id, approved: true });
        }}
        onDeny={(id) =>
          addToolApprovalResponse({
            id,
            approved: false,
            reason: "User declined this action",
          })
        }
        onEdit={onEdit}
      />
    );
  }

  if (part.state === "input-streaming" || part.state === "input-available") {
    const label =
      toolName === "send_email"
        ? "Preparing email…"
        : toolName === "create_calendar_invite"
          ? "Preparing calendar invite…"
          : `Processing ${toolName}…`;
    return (
      <div
        key={part.toolCallId}
        className="mr-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      >
        {label}
      </div>
    );
  }

  if (part.state === "output-available") {
    const label =
      toolName === "send_email"
        ? "Email sent"
        : toolName === "create_calendar_invite"
          ? "Calendar invite sent"
          : `${toolName} completed`;
    return (
      <details
        key={part.toolCallId}
        className="mr-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
      >
        <summary className="cursor-pointer text-muted-foreground">{label}</summary>
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

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="mr-2 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {label}
    </div>
  );
}

export function AgentChatPanel({
  onOpenSettings,
  onOpenInbox,
  onOpenCalendar,
  workspaceActive,
  contacts = [],
  openThread,
  shouldBridgeInviteToInbox,
  onEditTool,
  onToolApproved,
}: {
  onOpenSettings?: () => void;
  onOpenInbox?: () => void;
  onOpenCalendar?: () => void;
  workspaceActive?: "inbox" | "calendar" | null;
  contacts?: MentionContact[];
  openThread?: {
    threadId: string;
    attachments: Array<{
      messageId: string;
      attachmentId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }>;
  } | null;
  shouldBridgeInviteToInbox?: (input: Record<string, unknown>) => boolean;
  onEditTool?: (toolName: string, input: Record<string, unknown>) => void;
  onToolApproved?: (toolName: string, input: Record<string, unknown>) => void;
} = {}) {
  const [input, setInput] = useState("");
  const [mentions, setMentions] = useState<MentionContact[]>([]);
  const [stagedAttachments, setStagedAttachments] = useState<OutboundAttachmentMeta[]>([]);
  const [conversations, setConversations] = useState<AgentConversationItem[]>([]);
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([welcomeMessage()]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { provider, setProvider, availableProviders } = useAiProvider();
  const providerRef = useRef(provider);
  const conversationIdRef = useRef(conversationId);
  const lastUserTextRef = useRef<string | null>(null);
  const fallbackAttemptRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSendRef = useRef<string | null>(null);
  const mentionsRef = useRef<MentionContact[]>([]);
  const stagedAttachmentsRef = useRef<OutboundAttachmentMeta[]>([]);
  const openThreadRef = useRef(openThread);
  const historyRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);

  providerRef.current = provider;
  conversationIdRef.current = conversationId;
  mentionsRef.current = mentions;
  stagedAttachmentsRef.current = stagedAttachments;
  openThreadRef.current = openThread;

  const handleToolApproved = useCallback(
    (toolName: string, toolInput: Record<string, unknown>) => {
      if (toolName === "send_email" || toolName === "schedule_send") {
        const usedIds = asStringArray(toolInput.attachmentIds);
        if (usedIds.length > 0) {
          setStagedAttachments((prev) => prev.filter((item) => !usedIds.includes(item.id)));
        }
      }
      onToolApproved?.(toolName, toolInput);
    },
    [onToolApproved]
  );

  const chatId = conversationId ?? "draft";

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent/chat",
        prepareSendMessagesRequest: ({ messages, body, ...rest }) => ({
          ...rest,
          body: {
            ...body,
            messages: messages.filter((m) => m.id !== WELCOME_MESSAGE_ID),
            provider: providerRef.current,
            conversationId: conversationIdRef.current ?? undefined,
            mentionedContacts: mentionsRef.current,
            pendingAttachmentIds: stagedAttachmentsRef.current.map((item) => item.id),
            openThread: openThreadRef.current ?? undefined,
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, setMessages, addToolApprovalResponse, status, error } = useChat({
    id: chatId,
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const isBusy = status === "submitted" || status === "streaming";

  const refreshConversations = useCallback(async () => {
    try {
      const { conversations: list } = await listAgentConversationsApi();
      setConversations(list);
      setHistoryError(null);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Could not load chat history");
    }
  }, []);

  useEffect(() => {
    void refreshConversations().finally(() => setHistoryLoading(false));
  }, [refreshConversations]);

  useEffect(() => {
    if (!historyOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setHistoryOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [historyOpen]);

  const ensureConversation = useCallback(async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    const { conversation } = await createAgentConversationApi();
    setConversationId(conversation.id);
    conversationIdRef.current = conversation.id;
    setOpenTabIds((prev) => (prev.includes(conversation.id) ? prev : [...prev, conversation.id]));
    await refreshConversations();
    return conversation.id;
  }, [refreshConversations]);

  const startNewChat = useCallback(async () => {
    try {
      const { conversation } = await createAgentConversationApi();
      setConversationId(conversation.id);
      conversationIdRef.current = conversation.id;
      setOpenTabIds((prev) => [...prev, conversation.id]);
      setInitialMessages([welcomeMessage()]);
      setMessages([welcomeMessage()]);
      setStagedAttachments([]);
      setHistoryOpen(false);
      await refreshConversations();
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Could not start a new chat");
    }
  }, [refreshConversations, setMessages]);

  const openConversation = useCallback(
    async (id: string) => {
      try {
        setConversationId(id);
        conversationIdRef.current = id;
        setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        const { messages: stored } = await loadAgentConversationApi(id);
        const next = stored.length > 0 ? stored : [welcomeMessage()];
        setInitialMessages(next);
        setMessages(next);
        setHistoryOpen(false);
      } catch (err) {
        setHistoryError(err instanceof Error ? err.message : "Could not open chat");
      }
    },
    [setMessages]
  );

  useEffect(() => {
    if (historyLoading || autoOpenedRef.current || conversationId) return;
    if (conversations.length === 0) return;
    autoOpenedRef.current = true;
    void openConversation(conversations[0].id);
  }, [historyLoading, conversations, conversationId, openConversation]);

  const closeTab = useCallback(
    (id: string) => {
      setOpenTabIds((prev) => {
        const next = prev.filter((tabId) => tabId !== id);
        if (conversationId === id) {
          const fallback = next[next.length - 1];
          if (fallback) {
            void openConversation(fallback);
          } else {
            setConversationId(null);
            conversationIdRef.current = null;
            setInitialMessages([welcomeMessage()]);
            setMessages([welcomeMessage()]);
          }
        }
        return next;
      });
    },
    [conversationId, openConversation, setMessages]
  );

  useEffect(() => {
    if (historyLoading || autoOpenedRef.current || conversationId) return;
    if (conversations.length > 0) return;
    void ensureConversation();
  }, [historyLoading, conversations.length, conversationId, ensureConversation]);

  useEffect(() => {
    if (!conversationId || !pendingSendRef.current || isBusy) return;
    const text = pendingSendRef.current;
    pendingSendRef.current = null;
    void sendMessage({ text });
  }, [conversationId, isBusy, sendMessage]);

  useEffect(() => {
    if (!conversationId || status !== "ready") return;

    const persistable = messages.filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") && m.id !== WELCOME_MESSAGE_ID
    );
    if (persistable.length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveAgentConversationApi(conversationId, messages)
        .then(() => refreshConversations())
        .catch((err) => {
          setHistoryError(err instanceof Error ? err.message : "Could not save chat");
        });
    }, 400);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conversationId, messages, status, refreshConversations]);

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
    setMentions([]);
    lastUserTextRef.current = text;
    fallbackAttemptRef.current = false;

    if (!conversationIdRef.current) {
      pendingSendRef.current = text;
      void ensureConversation();
      return;
    }

    void sendMessage({ text });
  };

  const openTabs = openTabIds
    .map((id) => conversations.find((c) => c.id === id))
    .filter((c): c is AgentConversationItem => !!c);

  const activeTitle =
    conversations.find((c) => c.id === conversationId)?.title ??
    (conversationId ? "Chat" : "New chat");

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const hasStreamingText =
    lastAssistant?.parts.some((p) => isTextPart(p) && p.text.trim().length > 0) ?? false;
  const hasActiveTool = messages.some((m) =>
    m.parts.some(
      (p) =>
        isToolUIPart(p) &&
        p.state !== "output-available" &&
        p.state !== "output-denied" &&
        p.state !== "output-error"
    )
  );

  let statusLabel: string | null = null;
  if (status === "submitted") statusLabel = "Thinking…";
  else if (status === "streaming" && !hasStreamingText && !hasActiveTool)
    statusLabel = "Processing…";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
        {(onOpenInbox || onOpenCalendar) && (
          <div className="flex shrink-0 items-center gap-1 pr-2 border-r border-border mr-1">
            {onOpenInbox && (
              <button
                type="button"
                onClick={onOpenInbox}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-md px-2 text-[11px]",
                  workspaceActive === "inbox"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Inbox className="h-3.5 w-3.5" />
                Inbox
              </button>
            )}
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-md px-2 text-[11px]",
                  workspaceActive === "calendar"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Calendar
              </button>
            )}
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {openTabs.length === 0 ? (
            <span className="truncate px-2 text-[11px] text-muted-foreground">{activeTitle}</span>
          ) : (
            openTabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "group flex max-w-[140px] shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px]",
                  conversationId === tab.id
                    ? "border-border bg-muted/60 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/40"
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => void openConversation(tab.id)}
                >
                  {tab.title}
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
                  onClick={() => closeTab(tab.id)}
                  aria-label={`Close ${tab.title}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => void startNewChat()}
            aria-label="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="relative shrink-0" ref={historyRef}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-label="Show chat history"
            title="Show chat history"
          >
            <Clock className="h-3.5 w-3.5" />
          </Button>
          {historyOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-popover shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Chat history
                </p>
              </div>
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {historyLoading && (
                    <p className="px-2 py-2 text-[10px] text-muted-foreground">Loading…</p>
                  )}
                  {historyError && !historyLoading && (
                    <p className="px-2 py-2 text-[10px] text-destructive">{historyError}</p>
                  )}
                  {!historyLoading && conversations.length === 0 && (
                    <p className="px-2 py-2 text-[10px] text-muted-foreground">No previous chats</p>
                  )}
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => void openConversation(conversation.id)}
                      className={cn(
                        "w-full rounded-md px-2 py-2 text-left text-[11px] leading-snug transition-colors",
                        conversationId === conversation.id
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <span className="line-clamp-2">{conversation.title}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 bg-canvas">
        <Bot className="h-5 w-5 text-primary flex-shrink-0" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="truncate type-tagline text-ink" style={{ fontSize: 17 }}>
            {activeTitle}
          </p>
        </div>
        <span
          className="btn-pearl-capsule"
          style={{ padding: "4px 10px", fontSize: 12 }}
        >
          {AI_PROVIDER_CONFIG[provider].chatLabel}
        </span>
        {isBusy && (
          <Loader2 className="h-4 w-4 animate-spin text-ink-muted-48" strokeWidth={1.75} />
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.parts.map((part, index) => {
                if (isTextPart(part) && part.text.trim()) {
                  if (message.role === "user") {
                    return (
                      <div
                        key={`${message.id}-text-${index}`}
                        className="ml-12 rounded-[18px] bg-parchment px-4 py-3 type-body text-ink whitespace-pre-wrap"
                      >
                        {part.text}
                      </div>
                    );
                  }
                  return (
                    <p
                      key={`${message.id}-text-${index}`}
                      className="mr-4 type-body text-ink whitespace-pre-wrap"
                    >
                      {part.text}
                    </p>
                  );
                }

                if (isToolUIPart(part)) {
                  return renderToolPart(
                    part,
                    addToolApprovalResponse,
                    onEditTool,
                    handleToolApproved,
                    shouldBridgeInviteToInbox
                  );
                }

                return null;
              })}
            </div>
          ))}

          {statusLabel && <ThinkingIndicator label={statusLabel} />}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive space-y-2">
              <p>{error.message}</p>
              {error.message.includes("Settings") && onOpenSettings && (
                <Button size="sm" variant="outline" onClick={onOpenSettings}>
                  Open AI settings
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-hairline p-3 bg-canvas">
        <div className="mb-2 flex items-center justify-between gap-2">
          <AiProviderSelect
            value={provider}
            onChange={setProvider}
            availableProviders={availableProviders}
            disabled={isBusy}
          />
        </div>
        <AttachmentStaging
          attachments={stagedAttachments}
          onChange={setStagedAttachments}
          disabled={isBusy}
          className="mb-2"
        />
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-canvas pl-4 pr-1 py-1 transition-colors focus-within:border-[color:var(--color-primary-focus)]/60">
          <AgentMentionInput
            value={input}
            mentions={mentions}
            contacts={contacts}
            disabled={isBusy}
            onChange={(value, nextMentions) => {
              setInput(value);
              setMentions(nextMentions);
            }}
            onSubmit={handleSend}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isBusy || !input.trim()}
            aria-label="Send message"
            className="btn-icon-circular btn-icon-circular--sm !bg-primary !text-on-primary hover:!bg-[color:var(--color-primary-focus)] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <button
          type="button"
          className="mt-2 w-full truncate text-left type-fine text-ink-muted-48 hover:text-ink transition-colors"
          onClick={() => setInput(EXAMPLE_PROMPT)}
        >
          Try: {EXAMPLE_PROMPT}
        </button>
      </div>
    </div>
  );
}
