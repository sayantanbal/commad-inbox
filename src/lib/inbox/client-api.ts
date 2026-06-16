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

export type OutboundAttachmentMeta = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  source: "upload" | "thread_forward";
};

export async function uploadOutboundAttachmentApi(file: File): Promise<OutboundAttachmentMeta> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/inbox/outbound-attachments", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<OutboundAttachmentMeta>;
}

export async function stageThreadAttachmentApi(input: {
  threadId: string;
  messageId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<OutboundAttachmentMeta> {
  const response = await fetch("/api/inbox/outbound-attachments/from-thread", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<OutboundAttachmentMeta>;
}

export async function deleteOutboundAttachmentApi(id: string): Promise<void> {
  const response = await fetch(`/api/inbox/outbound-attachments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function fetchOutboundAttachmentMetaApi(
  ids: string[]
): Promise<OutboundAttachmentMeta[]> {
  if (ids.length === 0) return [];
  const response = await fetch(
    `/api/inbox/outbound-attachments?ids=${encodeURIComponent(ids.join(","))}`
  );
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as { attachments: OutboundAttachmentMeta[] };
  return data.attachments;
}

export async function queueSendApi(input: {
  to: string[];
  subject: string;
  body: string;
  threadId?: string;
  sendAt?: Date;
  attachmentIds?: string[];
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

export async function fetchMailboxThreadsApi(label: "sent" | "inbox" = "inbox") {
  const response = await fetch(`/api/inbox/threads?label=${label}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    threads: import("@/lib/inbox-serialize").SerializedThread[];
  }>;
}

export async function fetchInboxSyncApi() {
  const response = await fetch("/api/inbox/sync", { cache: "no-store" });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<import("@/lib/inbox-serialize").SerializedInboxData>;
}

export type DailyBriefStreamEvent =
  | { type: "status"; message: string }
  | { type: "partial"; brief: Partial<import("@/lib/schemas/domain").DailyBrief> }
  | {
      type: "complete";
      brief: import("@/lib/schemas/domain").DailyBrief;
      provider: string;
      source: "ai" | "cache";
    }
  | { type: "error"; message: string };

export async function streamDailyBriefApi(
  provider: "openai" | "gemini",
  options: {
    refresh?: boolean;
    timezone?: string;
    onEvent: (event: DailyBriefStreamEvent) => void;
    signal?: AbortSignal;
  }
) {
  const response = await fetch("/api/inbox/daily-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      refresh: options.refresh ?? false,
      stream: true,
      timezone:
        options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Daily brief stream unavailable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as DailyBriefStreamEvent;
      options.onEvent(event);
      if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer) as DailyBriefStreamEvent;
    options.onEvent(event);
    if (event.type === "error") {
      throw new Error(event.message);
    }
  }
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

export interface CommitmentItem {
  id: string;
  threadId: string;
  direction: "outbound" | "inbound";
  text: string;
  dueDate: string | null;
  counterpartyEmail: string;
  status: string;
  confidence: number;
}

export async function fetchCommitmentsApi(view?: "commitments" | "waiting") {
  const params = view ? `?view=${view === "waiting" ? "waiting" : "commitments"}` : "";
  const response = await fetch(`/api/inbox/commitments${params}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ commitments: CommitmentItem[] }>;
}

export async function patchCommitmentApi(
  commitmentId: string,
  status: "fulfilled" | "dismissed" | "open"
) {
  const response = await fetch("/api/inbox/commitments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commitmentId, status }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function confirmCommitmentApi(commitmentId: string) {
  const response = await fetch("/api/inbox/commitments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commitmentId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function fetchPreBriefApi(attendeeEmail: string) {
  const params = new URLSearchParams({ attendeeEmail });
  const response = await fetch(`/api/inbox/pre-brief?${params}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ brief: import("@/lib/schemas/domain").MeetingBriefStored }>;
}

export async function fetchContactsApi() {
  const response = await fetch("/api/inbox/contacts");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    contacts: Array<{
      id: string;
      email: string;
      displayName: string;
      source: string;
      lastContactAt: string | null;
      avgResponseHours: number | null;
      warmth: string;
      openCommitmentCount: number;
      emailCount30d: number;
      isAppContact: boolean;
    }>;
  }>;
}

export async function addContactApi(input: {
  email: string;
  displayName?: string;
}) {
  const response = await fetch("/api/inbox/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ id: string; created: boolean }>;
}

export async function dismissContactApi(email: string) {
  const response = await fetch("/api/inbox/contacts/dismiss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ success: boolean }>;
}

export type AppContactListRow = {
  id: string;
  email: string;
  displayName: string | null;
  source: string;
  createdAt: string;
};

export async function fetchAppContactsListApi(params: {
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  const response = await fetch(`/api/inbox/contacts/app?${search}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    contacts: AppContactListRow[];
    total: number;
    page: number;
    pageSize: number;
  }>;
}

export type GoogleContactsStatus = {
  connected: boolean;
  lastSyncedAt: string | null;
  connectedAt: string | null;
};

export async function fetchGoogleContactsStatusApi() {
  const response = await fetch("/api/inbox/contacts/google");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<GoogleContactsStatus>;
}

export async function syncGoogleContactsApi() {
  const response = await fetch("/api/inbox/contacts/google", { method: "POST" });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<
    GoogleContactsStatus & { imported: number; skipped: number; total: number }
  >;
}

export async function disconnectGoogleContactsApi(removeImported: boolean) {
  const response = await fetch("/api/inbox/contacts/google", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ removeImported }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ success: boolean; removedContacts: number }>;
}

export async function fetchFreeBusyApi(emails: string[], start: Date, end: Date) {
  const params = new URLSearchParams({
    emails: emails.join(","),
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const response = await fetch(`/api/inbox/free-busy?${params}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    busy: Record<string, Array<{ start: string; end: string }>>;
  }>;
}

export async function rescheduleCalendarEventApi(input: {
  eventId: string;
  slotStart: Date;
  durationMinutes?: number;
}) {
  const response = await fetch("/api/inbox/calendar-event", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: input.eventId,
      slotStart: input.slotStart.toISOString(),
      durationMinutes: input.durationMinutes,
    }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    eventId: string;
    start: string;
    end: string;
    durationMinutes: number;
    hangoutLink?: string;
    htmlLink?: string;
  }>;
}

export async function fetchPreferencesApi() {
  const response = await fetch("/api/inbox/preferences");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function patchPreferencesApi(patch: Record<string, unknown>) {
  const response = await fetch("/api/inbox/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function fetchSnippetsApi() {
  const response = await fetch("/api/inbox/snippets");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ snippets: Array<{ id: string; name: string; body: string }> }>;
}

export async function exportTaskApi(input: {
  threadId: string;
  title: string;
  description: string;
  teamId?: string;
}) {
  const response = await fetch("/api/inbox/export-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ task: { id: string; url: string } }>;
}

export async function connectLinearApi(accessToken: string, teamId?: string) {
  const response = await fetch("/api/connect/linear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, teamId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export type AiKeysStatus = {
  keys: Partial<
    Record<
      "openai" | "gemini",
      { hint: string; updatedAt: string; source: "user" }
    >
  >;
  platform: Record<"openai" | "gemini", boolean>;
  available: Array<"openai" | "gemini">;
};

export async function fetchAiKeysApi() {
  const response = await fetch("/api/inbox/ai-keys");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<AiKeysStatus>;
}

export async function saveAiKeyApi(provider: "openai" | "gemini", apiKey: string) {
  const response = await fetch("/api/inbox/ai-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, apiKey }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{
    success: boolean;
    key: { hint: string; updatedAt: string; source: "user" };
  }>;
}

export async function deleteAiKeyApi(provider: "openai" | "gemini") {
  const response = await fetch(`/api/inbox/ai-keys?provider=${provider}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<AiKeysStatus & { success: boolean }>;
}

export async function fetchSendTimeSuggestionApi(counterpartyEmail: string, threadId?: string) {
  const response = await fetch("/api/inbox/send-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ counterpartyEmail, threadId }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ suggestion: import("@/lib/schemas/domain").SendTimeSuggestion }>;
}
