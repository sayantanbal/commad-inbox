import { addMinutes } from "date-fns";
import type { CorsairInstance } from "@/lib/corsair";
import { buildRawEmail } from "@/lib/gmail/raw-message";
import { replyRecipients, resolveMeetingAttendees } from "@/lib/inbox/recipients";

export { replyRecipients, resolveMeetingAttendees };

export async function archiveGmailThread(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  threadId: string
): Promise<void> {
  await tenant.gmail.api.threads.modify({
    id: threadId,
    removeLabelIds: ["INBOX"],
  });
}

export async function restoreGmailThread(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  threadId: string
): Promise<void> {
  await tenant.gmail.api.threads.modify({
    id: threadId,
    addLabelIds: ["INBOX"],
  });
}

export async function sendGmailMessage(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  params: {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ messageId: string; threadId?: string }> {
  const raw = buildRawEmail(params);
  const response = await tenant.gmail.api.messages.send({
    raw,
    threadId: params.threadId,
  });

  if (!response.id) {
    throw new Error("Gmail send returned no message id");
  }

  return { messageId: response.id, threadId: response.threadId };
}

export async function createCalendarEventWithMeet(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  params: {
    summary: string;
    start: Date;
    durationMinutes: number;
    attendees: string[];
    description?: string;
  }
): Promise<{ eventId: string; hangoutLink?: string; htmlLink?: string }> {
  const end = addMinutes(params.start, params.durationMinutes);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const requestId = crypto.randomUUID();

  const eventPayload = {
    summary: params.summary,
    description: params.description,
    start: { dateTime: params.start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
    attendees: params.attendees.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const created = await tenant.googlecalendar.api.events.create({
    calendarId: "primary",
    sendUpdates: "all",
    conferenceDataVersion: 1,
    event: eventPayload as Parameters<
      ReturnType<CorsairInstance["withTenant"]>["googlecalendar"]["api"]["events"]["create"]
    >[0]["event"],
  });

  if (!created.id) {
    throw new Error("Calendar create returned no event id");
  }

  return {
    eventId: created.id,
    hangoutLink: created.hangoutLink,
    htmlLink: created.htmlLink,
  };
}

export async function createCalendarFocusBlock(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  params: {
    summary?: string;
    start: Date;
    durationMinutes: number;
  }
): Promise<{ eventId: string; htmlLink?: string }> {
  const end = addMinutes(params.start, params.durationMinutes);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const created = await tenant.googlecalendar.api.events.create({
    calendarId: "primary",
    sendUpdates: "none",
    event: {
      summary: params.summary ?? "Focus time",
      description: "Blocked for deep work via Command Inbox",
      start: { dateTime: params.start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
      transparency: "opaque",
      visibility: "private",
    },
  });

  if (!created.id) {
    throw new Error("Calendar create returned no event id");
  }

  return {
    eventId: created.id,
    htmlLink: created.htmlLink,
  };
}

export async function updateCalendarEventTime(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  params: {
    eventId: string;
    start: Date;
    durationMinutes: number;
  }
): Promise<{ eventId: string; hangoutLink?: string; htmlLink?: string }> {
  const end = addMinutes(params.start, params.durationMinutes);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const updated = await tenant.googlecalendar.api.events.update({
    calendarId: "primary",
    id: params.eventId,
    sendUpdates: "all",
    event: {
      start: { dateTime: params.start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
    },
  });

  if (!updated.id) {
    throw new Error("Calendar update returned no event id");
  }

  return {
    eventId: updated.id,
    hangoutLink: updated.hangoutLink,
    htmlLink: updated.htmlLink,
  };
}

export async function cancelCalendarEvent(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  eventId: string
): Promise<void> {
  await tenant.googlecalendar.api.events.delete({
    calendarId: "primary",
    id: eventId,
    sendUpdates: "all",
  });
}
