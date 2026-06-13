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

export async function generateDraftApi(threadId: string, tone: "professional" | "friendly" | "brief") {
  const response = await fetch("/api/inbox/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, tone }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json() as Promise<{ draftHtml: string }>;
}
