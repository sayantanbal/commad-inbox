import type { AiSummary } from "@/lib/schemas/domain";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function archiveThreadApi(threadId: string) {
  const response = await fetch("/api/inbox/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function restoreThreadApi(threadId: string, lane: string) {
  const response = await fetch("/api/inbox/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, lane }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function snoozeThreadApi(threadId: string, until: Date) {
  const response = await fetch("/api/inbox/snooze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, until: until.toISOString() }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function unsnoozeThreadApi(threadId: string) {
  const response = await fetch("/api/inbox/snooze", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function queueSendApi(input: {
  to: string[];
  subject: string;
  body: string;
  threadId?: string;
  sendAt?: Date;
}) {
  const response = await fetch("/api/inbox/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      sendAt: input.sendAt?.toISOString(),
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    scheduledSendId: string;
    sendAt: string;
    undoWindowMs: number;
  }>;
}

export async function dispatchSendApi(scheduledSendId: string) {
  const response = await fetch("/api/inbox/send", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledSendId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function cancelSendApi(scheduledSendId: string) {
  const response = await fetch("/api/inbox/send", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledSendId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function createMeetingApi(input: {
  threadId: string;
  slotStart: Date;
  durationMinutes?: number;
}) {
  const response = await fetch("/api/inbox/meeting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId: input.threadId,
      slotStart: input.slotStart.toISOString(),
      durationMinutes: input.durationMinutes,
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    eventId: string;
    hangoutLink?: string;
    draftHtml: string;
    meeting: {
      threadId: string;
      eventId: string;
      start: string;
      durationMinutes: number;
    };
    classification?: { threadId: string; lane: string };
  }>;
}

export async function updateMeetingApi(input: {
  threadId: string;
  slotStart: Date;
  durationMinutes?: number;
}) {
  const response = await fetch("/api/inbox/meeting", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      threadId: input.threadId,
      slotStart: input.slotStart.toISOString(),
      durationMinutes: input.durationMinutes,
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    eventId: string;
    hangoutLink?: string;
    draftHtml: string;
    meeting: {
      threadId: string;
      eventId: string;
      start: string;
      durationMinutes: number;
    };
  }>;
}

export async function cancelMeetingApi(threadId: string) {
  const response = await fetch("/api/inbox/meeting", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ eventId: string }>;
}

export async function createFocusBlockApi(input: {
  start: Date;
  durationMinutes?: number;
  summary?: string;
}) {
  const response = await fetch("/api/inbox/focus-block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start: input.start.toISOString(),
      durationMinutes: input.durationMinutes ?? 90,
      summary: input.summary,
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    eventId: string;
    summary: string;
    start: string;
    end: string;
    htmlLink?: string;
  }>;
}

export async function deleteFocusBlockApi(eventId: string) {
  const response = await fetch("/api/inbox/focus-block", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ eventId: string }>;
}

export async function generateDraftApi(
  threadId: string,
  tone: "professional" | "friendly" | "brief"
) {
  const response = await fetch("/api/inbox/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, tone }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ draftHtml: string; source: "ai" | "template" }>;
}

export async function fetchThreadSummaryApi(
  threadId: string,
  messageCount: number,
  provider: "openai" | "gemini"
) {
  const params = new URLSearchParams({
    threadId,
    messageCount: String(messageCount),
  });
  const cached = await fetch(`/api/inbox/summary?${params}`);
  if (cached.ok) {
    const data = (await cached.json()) as { cached: boolean; summary?: AiSummary };
    if (data.cached && data.summary) {
      return { summary: data.summary, source: "cache" as const };
    }
  }

  const response = await fetch("/api/inbox/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, provider }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    summary: AiSummary;
    source: "ai" | "cache";
  }>;
}

export async function fetchCalendarEventsApi(month: string) {
  const response = await fetch(`/api/inbox/events?month=${encodeURIComponent(month)}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    month: string;
    events: Array<
      Omit<import("@/lib/types").CalendarEvent, "start" | "end"> & {
        start: string;
        end: string;
      }
    >;
  }>;
}

export async function fetchDailyBriefApi(
  provider: "openai" | "gemini",
  options?: { refresh?: boolean; timezone?: string }
) {
  const response = await fetch("/api/inbox/daily-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      refresh: options?.refresh ?? false,
      timezone:
        options?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    brief: import("@/lib/schemas/domain").DailyBrief;
    provider: string;
    source: "ai" | "cache";
  }>;
}

export interface AgentConversationItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export async function listAgentConversationsApi() {
  const response = await fetch("/api/agent/conversations");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ conversations: AgentConversationItem[] }>;
}

export async function createAgentConversationApi() {
  const response = await fetch("/api/agent/conversations", { method: "POST" });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ conversation: AgentConversationItem }>;
}

export async function loadAgentConversationApi(conversationId: string) {
  const response = await fetch(`/api/agent/conversations/${conversationId}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ messages: import("ai").UIMessage[] }>;
}

export async function saveAgentConversationApi(
  conversationId: string,
  messages: import("ai").UIMessage[]
) {
  const response = await fetch(`/api/agent/conversations/${conversationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}
