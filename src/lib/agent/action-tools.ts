import { tool, zodSchema, type ToolSet } from "ai";
import {
  cancelCalendarEvent,
  createCalendarEventWithMeet,
  sendGmailMessage,
  updateCalendarEventTime,
} from "@/lib/corsair/actions";
import type { CorsairInstance } from "@/lib/corsair";
import { queueSend } from "@/lib/inbox/scheduled-sends";
import { replyRecipients } from "@/lib/inbox/recipients";
import { generateCancellationDraft } from "@/lib/ai/drafts";
import { getThreadMeetingForThread, deleteThreadMeeting } from "@/lib/inbox/thread-meetings";
import { toolMetadata } from "@/lib/agent/tool-annotations";
import {
  cancelCalendarEventToolInputSchema,
  cancelMeetingWithNoticeToolInputSchema,
  cancelMeetingWithNoticeToolOutputSchema,
  createCalendarInviteToolInputSchema,
  createCalendarInviteToolOutputSchema,
  draftCommitmentFollowUpToolInputSchema,
  getThreadSummaryToolInputSchema,
  listCalendarEventsToolInputSchema,
  listCalendarEventsToolOutputSchema,
  rescheduleCalendarEventToolInputSchema,
  scheduleSendToolInputSchema,
  scheduleSendToolOutputSchema,
  searchThreadsToolInputSchema,
  searchThreadsToolOutputSchema,
  sendEmailToolInputSchema,
  sendEmailToolOutputSchema,
  stageThreadAttachmentToolInputSchema,
} from "@/lib/schemas/agent-tools";
import { resolveAttachmentsForSend } from "@/lib/gmail/resolve-attachments";
import { advancedSearch } from "@/lib/search/advanced";
import { ensureFollowUpDraft } from "@/lib/commitments/follow-up-draft";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { getClassificationsForUser } from "@/lib/corsair/classifications";
import {
  generateThreadSummary,
  getCachedThreadSummary,
  saveThreadSummary,
} from "@/lib/ai/thread-summary";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
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
      outputSchema: zodSchema(sendEmailToolOutputSchema),
      metadata: toolMetadata("send_email"),
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
        return {
          messageId: result.messageId,
          recipients,
          attachmentCount: attachments.length,
          summary: `Email sent to ${recipients.join(", ")}${attachNote}.`,
        };
      },
    }),
    schedule_send: tool({
      description:
        "Schedule an email to send later at a specific time. Supports to, cc, bcc, and attachmentIds. User confirms before queueing.",
      inputSchema: scheduleSendToolInputSchema,
      outputSchema: zodSchema(scheduleSendToolOutputSchema),
      metadata: toolMetadata("schedule_send"),
      needsApproval: true,
      execute: async ({ to, subject, body, sendAt, threadId, attachmentIds }) => {
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
        const attachmentCount = attachmentIds?.length ?? 0;
        const attachNote = attachmentCount > 0 ? ` with ${attachmentCount} attachment(s)` : "";
        return {
          scheduledSendId: queued.id,
          sendAt: sendDate.toISOString(),
          recipients,
          attachmentCount,
          summary: `Email scheduled for ${sendDate.toLocaleString()}${attachNote}.`,
        };
      },
    }),
    create_calendar_invite: tool({
      description:
        "Create a Google Calendar event with a Meet link and email attendees. User confirms before sending. For personal reminders with no guests, omit attendees (your calendar only).",
      inputSchema: createCalendarInviteToolInputSchema,
      outputSchema: zodSchema(createCalendarInviteToolOutputSchema),
      metadata: toolMetadata("create_calendar_invite"),
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
        return {
          eventId: result.eventId,
          summary,
          start,
          hangoutLink: result.hangoutLink,
          htmlLink: result.htmlLink,
          summaryText: `Calendar invite sent: "${summary}" at ${new Date(start).toLocaleString()}.${meet}`,
        };
      },
    }),
    list_calendar_events: tool({
      description: "List calendar events in a date range for the user's primary calendar.",
      inputSchema: listCalendarEventsToolInputSchema,
      outputSchema: zodSchema(listCalendarEventsToolOutputSchema),
      metadata: toolMetadata("list_calendar_events"),
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
        const events = items.map((event) => ({
          id: event.id ?? "unknown",
          summary: event.summary ?? "Untitled",
          start: event.start?.dateTime ?? event.start?.date ?? "",
        }));
        return { count: events.length, events };
      },
    }),
    reschedule_calendar_event: tool({
      description: "Reschedule an existing calendar event by id. User confirms before updating.",
      inputSchema: rescheduleCalendarEventToolInputSchema,
      metadata: toolMetadata("reschedule_calendar_event"),
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
      metadata: toolMetadata("cancel_calendar_event"),
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
      metadata: toolMetadata("stage_thread_attachment"),
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
    search_threads: tool({
      description:
        "Search Gmail threads using Gmail query syntax and an optional triage lane filter. Read-only — use instead of raw gmail.api discovery.",
      inputSchema: searchThreadsToolInputSchema,
      outputSchema: zodSchema(searchThreadsToolOutputSchema),
      metadata: toolMetadata("search_threads"),
      execute: async ({ q, lane, limit }) => {
        const results = await advancedSearch(userId, tenant, { query: q, lane, limit });
        return {
          count: results.length,
          threads: results.map((hit) => ({
            threadId: hit.threadId,
            subject: hit.subject,
            sender: hit.sender,
            lane: hit.lane,
          })),
        };
      },
    }),
    draft_commitment_follow_up: tool({
      description:
        "Generate a follow-up email draft for an inbound (waiting) commitment. Saves the draft for human review — does not send.",
      inputSchema: draftCommitmentFollowUpToolInputSchema,
      metadata: toolMetadata("draft_commitment_follow_up"),
      needsApproval: true,
      execute: async ({ commitmentId }) => {
        const result = await ensureFollowUpDraft(userId, commitmentId);
        const preview = result.draftHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return `Follow-up draft ${result.generated ? "generated" : "loaded"} for thread ${result.threadId} (to ${result.counterpartyEmail}). Preview: ${preview.slice(0, 200)}… Open Waiting For → Review follow-up to edit and send.`;
      },
    }),
    get_thread_summary: tool({
      description:
        "Summarize a Gmail thread with bullet points and suggested actions. Read-only — uses cached summary when available.",
      inputSchema: getThreadSummaryToolInputSchema,
      metadata: toolMetadata("get_thread_summary"),
      execute: async ({ threadId }) => {
        const full = await tenant.gmail.api.threads.get({ id: threadId, format: "full" });
        const thread = mapGmailThread(full);
        if (!thread) return "Thread not found.";

        const classifications = await getClassificationsForUser(userId);
        const classification = classifications.find((item) => item.threadId === threadId);
        const messageCount = thread.messages.length;

        let summary = await getCachedThreadSummary(userId, threadId, messageCount);
        let provider = await getDefaultProvider(userId);

        if (!summary) {
          const generated = await generateThreadSummary(userId, thread, classification, provider);
          summary = generated.summary;
          provider = generated.provider;
          await saveThreadSummary(userId, threadId, messageCount, summary, provider);
        }

        return JSON.stringify({
          threadId,
          subject: thread.subject,
          lane: classification?.lane ?? null,
          priority: classification?.priority ?? null,
          bullets: summary.bullets,
          actions: summary.actions,
        });
      },
    }),
    cancel_meeting_with_notice: tool({
      description:
        "Cancel the meeting linked to a thread and queue a cancellation email to attendees. User reviews before send; calendar removes on approval.",
      inputSchema: cancelMeetingWithNoticeToolInputSchema,
      outputSchema: zodSchema(cancelMeetingWithNoticeToolOutputSchema),
      metadata: toolMetadata("cancel_meeting_with_notice"),
      needsApproval: true,
      execute: async ({ threadId }) => {
        const linked = await getThreadMeetingForThread(userId, threadId);
        if (!linked) {
          throw new Error("No meeting linked to this thread");
        }

        const full = await tenant.gmail.api.threads.get({ id: threadId, format: "full" });
        const thread = mapGmailThread(full);
        if (!thread) {
          throw new Error("Thread not found");
        }

        const draftHtml = await generateCancellationDraft({
          userId,
          thread,
          slotStart: linked.start,
          durationMinutes: linked.durationMinutes,
        });

        const subject = thread.subject.startsWith("Re:")
          ? thread.subject
          : `Re: ${thread.subject}`;
        const to = replyRecipients(thread, userEmail);
        if (to.length === 0) {
          throw new Error("No recipients found for cancellation notice");
        }

        const queued = await queueSend(userId, {
          to,
          subject,
          body: draftHtml,
          threadId,
          sendAt: new Date(Date.now() + 5000),
        });

        await cancelCalendarEvent(tenant, linked.eventId);
        await deleteThreadMeeting(userId, threadId);

        return {
          threadId,
          eventId: linked.eventId,
          scheduledSendId: queued.id,
          summary: `Cancellation email queued (5s undo window) and meeting ${linked.eventId} removed.`,
        };
      },
    }),
  };
}
