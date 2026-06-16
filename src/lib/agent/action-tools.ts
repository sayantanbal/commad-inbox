import { tool, type ToolSet } from "ai";
import {
  cancelCalendarEvent,
  createCalendarEventWithMeet,
  sendGmailMessage,
  updateCalendarEventTime,
} from "@/lib/corsair/actions";
import type { CorsairInstance } from "@/lib/corsair";
import { queueSend } from "@/lib/inbox/scheduled-sends";
import {
  cancelCalendarEventToolInputSchema,
  createCalendarInviteToolInputSchema,
  listCalendarEventsToolInputSchema,
  rescheduleCalendarEventToolInputSchema,
  scheduleSendToolInputSchema,
  sendEmailToolInputSchema,
  stageThreadAttachmentToolInputSchema,
} from "@/lib/schemas/agent-tools";
import { resolveAttachmentsForSend } from "@/lib/gmail/resolve-attachments";
import {
  deleteOutboundAttachments,
  stageThreadAttachment,
} from "@/lib/gmail/outbound-attachment";

function toHtmlBody(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function normalizeEmails(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

export function buildAgentActionTools(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  userId: string,
  userEmail: string
): ToolSet {
  return {
    send_email: tool({
      description:
        "Send an email from the user's Gmail account. Supports to, cc, bcc, and native Gmail attachments via attachmentIds. The user reviews a preview before send.",
      inputSchema: sendEmailToolInputSchema,
      needsApproval: true,
      execute: async ({ to, cc, bcc, subject, body, threadId, attachmentIds }) => {
        const recipients = normalizeEmails(to);
        const attachments = await resolveAttachmentsForSend(userId, attachmentIds);
        const result = await sendGmailMessage(tenant, {
          from: userEmail,
          to: recipients,
          cc: cc ? normalizeEmails(cc) : undefined,
          bcc: bcc ? normalizeEmails(bcc) : undefined,
          subject,
          bodyHtml: toHtmlBody(body),
          threadId,
          attachments,
        });
        if (attachmentIds?.length) {
          await deleteOutboundAttachments(userId, attachmentIds);
        }
        const attachNote =
          attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : "";
        return `Email sent to ${recipients.join(", ")}${attachNote} (message id: ${result.messageId}).`;
      },
    }),
    schedule_send: tool({
      description:
        "Schedule an email to send later at a specific time. Supports to, cc, bcc, and attachmentIds. User confirms before queueing.",
      inputSchema: scheduleSendToolInputSchema,
      needsApproval: true,
      execute: async ({ to, cc, bcc, subject, body, sendAt, threadId, attachmentIds }) => {
        const recipients = normalizeEmails(to);
        const sendDate = new Date(sendAt);
        const queued = await queueSend(userId, {
          to: recipients,
          subject,
          body: toHtmlBody(body),
          threadId,
          sendAt: sendDate,
          attachmentIds,
        });
        const attachNote =
          attachmentIds?.length ? ` with ${attachmentIds.length} attachment(s)` : "";
        return `Email scheduled for ${sendDate.toLocaleString()}${attachNote} (id: ${queued.id}).`;
      },
    }),
    create_calendar_invite: tool({
      description:
        "Create a Google Calendar event with a Meet link and email attendees. User confirms before sending. For personal reminders with no guests, omit attendees (your calendar only).",
      inputSchema: createCalendarInviteToolInputSchema,
      needsApproval: true,
      execute: async ({ summary, start, durationMinutes, attendees, description }) => {
        const invitees = attendees.length > 0 ? attendees : [userEmail];
        const result = await createCalendarEventWithMeet(tenant, {
          summary,
          start: new Date(start),
          durationMinutes,
          attendees: invitees,
          description,
        });
        const meet = result.hangoutLink ? ` Meet link: ${result.hangoutLink}.` : "";
        return `Calendar invite sent: "${summary}" at ${new Date(start).toLocaleString()}.${meet}`;
      },
    }),
    list_calendar_events: tool({
      description: "List calendar events in a date range for the user's primary calendar.",
      inputSchema: listCalendarEventsToolInputSchema,
      execute: async ({ start, end }) => {
        const response = await tenant.googlecalendar.api.events.getMany({
          calendarId: "primary",
          timeMin: new Date(start).toISOString(),
          timeMax: new Date(end).toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 50,
        });
        const items = response.items ?? [];
        if (items.length === 0) return "No events in that range.";
        return items
          .map((event) => {
            const startRaw = event.start?.dateTime ?? event.start?.date ?? "";
            return `- ${event.summary ?? "Untitled"} (${startRaw}) id=${event.id}`;
          })
          .join("\n");
      },
    }),
    reschedule_calendar_event: tool({
      description: "Reschedule an existing calendar event by id. User confirms before updating.",
      inputSchema: rescheduleCalendarEventToolInputSchema,
      needsApproval: true,
      execute: async ({ eventId, start, durationMinutes }) => {
        const result = await updateCalendarEventTime(tenant, {
          eventId,
          start: new Date(start),
          durationMinutes,
        });
        return `Event ${result.eventId} rescheduled to ${new Date(start).toLocaleString()}.`;
      },
    }),
    cancel_calendar_event: tool({
      description: "Cancel/delete a calendar event by id and notify attendees.",
      inputSchema: cancelCalendarEventToolInputSchema,
      needsApproval: true,
      execute: async ({ eventId }) => {
        await cancelCalendarEvent(tenant, eventId);
        return `Event ${eventId} cancelled.`;
      },
    }),
    stage_thread_attachment: tool({
      description:
        "Stage an attachment from the current Gmail thread for a later send_email call. Returns an attachmentId to pass to send_email.",
      inputSchema: stageThreadAttachmentToolInputSchema,
      execute: async ({ messageId, attachmentId, filename, mimeType, sizeBytes }) => {
        const staged = await stageThreadAttachment(userId, tenant, {
          messageId,
          attachmentId,
          filename,
          mimeType,
          sizeBytes,
        });
        return `Staged attachment "${staged.filename}" (id: ${staged.id}, ${staged.sizeBytes} bytes). Pass this id in send_email.attachmentIds.`;
      },
    }),
  };
}
