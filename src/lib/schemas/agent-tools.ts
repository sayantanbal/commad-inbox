import { z } from "zod";
import { threadIdField, triageLaneSchema } from "@/lib/schemas/domain";
import { LIMITS } from "@/lib/schemas/limits";
import {
  boundedString,
  emailOrListSchema,
  nonEmptyBoundedString,
  strictObject,
  uuidArraySchema,
} from "@/lib/schemas/primitives";

/** Lenient ISO datetime for LLM tool args — accepts Z, offsets, or local form; normalizes to UTC. */
export const agentDatetimeSchema = z
  .string()
  .min(1, "datetime is required")
  .max(40, "datetime is too long")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "must be a valid ISO 8601 datetime",
  })
  .transform((value) => new Date(value).toISOString());

export const sendEmailToolInputSchema = strictObject({
  to: emailOrListSchema,
  cc: emailOrListSchema.optional(),
  bcc: emailOrListSchema.optional(),
  subject: nonEmptyBoundedString(LIMITS.EMAIL_SUBJECT, "subject"),
  body: nonEmptyBoundedString(LIMITS.EMAIL_BODY, "body"),
  threadId: threadIdField.optional(),
  attachmentIds: uuidArraySchema.optional(),
});

export const scheduleSendToolInputSchema = strictObject({
  to: emailOrListSchema,
  cc: emailOrListSchema.optional(),
  bcc: emailOrListSchema.optional(),
  subject: nonEmptyBoundedString(LIMITS.EMAIL_SUBJECT, "subject"),
  body: nonEmptyBoundedString(LIMITS.EMAIL_BODY, "body"),
  sendAt: agentDatetimeSchema,
  threadId: threadIdField.optional(),
  attachmentIds: uuidArraySchema.optional(),
});

export const listCalendarEventsToolInputSchema = strictObject({
  start: agentDatetimeSchema,
  end: agentDatetimeSchema,
});

export const rescheduleCalendarEventToolInputSchema = strictObject({
  eventId: nonEmptyBoundedString(LIMITS.EVENT_ID, "eventId"),
  start: agentDatetimeSchema,
  durationMinutes: z.number().int().min(15).max(240).default(30),
});

export const cancelCalendarEventToolInputSchema = strictObject({
  eventId: nonEmptyBoundedString(LIMITS.EVENT_ID, "eventId"),
});

export const createCalendarInviteToolInputSchema = strictObject({
  summary: nonEmptyBoundedString(LIMITS.SHORT_STRING, "summary"),
  start: agentDatetimeSchema,
  durationMinutes: z
    .number()
    .int({ message: "durationMinutes must be a whole number" })
    .min(15, { message: "durationMinutes must be at least 15" })
    .max(240, { message: "durationMinutes must be at most 240" })
    .default(30),
  attendees: z
    .array(z.string().email({ message: "attendees must be valid email addresses" }))
    .max(LIMITS.EMAIL_RECIPIENTS)
    .default([]),
  description: boundedString(LIMITS.MEDIUM_STRING, "description").optional(),
});

export const stageThreadAttachmentToolInputSchema = strictObject({
  messageId: nonEmptyBoundedString(LIMITS.MESSAGE_ID, "messageId"),
  attachmentId: nonEmptyBoundedString(LIMITS.ATTACHMENT_ID, "attachmentId"),
  filename: nonEmptyBoundedString(LIMITS.FILENAME, "filename"),
  mimeType: nonEmptyBoundedString(LIMITS.MIME_TYPE, "mimeType"),
  sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
});

export const searchThreadsToolInputSchema = strictObject({
  q: boundedString(LIMITS.SEARCH_QUERY, "q").optional(),
  lane: triageLaneSchema.optional(),
  limit: z.number().int().min(1).max(30).default(10),
});

export const draftCommitmentFollowUpToolInputSchema = strictObject({
  commitmentId: nonEmptyBoundedString(LIMITS.COMMITMENT_ID, "commitmentId"),
});

export const getThreadSummaryToolInputSchema = strictObject({
  threadId: threadIdField,
});

export const cancelMeetingWithNoticeToolInputSchema = strictObject({
  threadId: threadIdField,
});

export const sendEmailToolOutputSchema = strictObject({
  messageId: nonEmptyBoundedString(LIMITS.MESSAGE_ID, "messageId"),
  recipients: z.array(z.string().email()).min(1),
  attachmentCount: z.number().int().min(0),
  summary: boundedString(LIMITS.MEDIUM_STRING, "summary"),
});

export const createCalendarInviteToolOutputSchema = strictObject({
  eventId: nonEmptyBoundedString(LIMITS.EVENT_ID, "eventId"),
  summary: nonEmptyBoundedString(LIMITS.SHORT_STRING, "summary"),
  start: z.string(),
  hangoutLink: boundedString(LIMITS.URL, "hangoutLink").optional(),
  htmlLink: boundedString(LIMITS.URL, "htmlLink").optional(),
  summaryText: boundedString(LIMITS.MEDIUM_STRING, "summaryText"),
});

export const listCalendarEventsToolOutputSchema = strictObject({
  count: z.number().int().min(0),
  events: z.array(
    strictObject({
      id: boundedString(LIMITS.EVENT_ID, "id"),
      summary: boundedString(LIMITS.SHORT_STRING, "summary"),
      start: z.string(),
    })
  ),
});

export const cancelMeetingWithNoticeToolOutputSchema = strictObject({
  threadId: threadIdField,
  eventId: nonEmptyBoundedString(LIMITS.EVENT_ID, "eventId"),
  scheduledSendId: z.string().uuid(),
  summary: boundedString(LIMITS.MEDIUM_STRING, "summary"),
});

export const scheduleSendToolOutputSchema = strictObject({
  scheduledSendId: z.string().uuid(),
  sendAt: z.string(),
  recipients: z.array(z.string().email()).min(1),
  attachmentCount: z.number().int().min(0),
  summary: boundedString(LIMITS.MEDIUM_STRING, "summary"),
});

export const searchThreadsToolOutputSchema = strictObject({
  count: z.number().int().min(0),
  threads: z.array(
    strictObject({
      threadId: threadIdField,
      subject: boundedString(LIMITS.EMAIL_SUBJECT, "subject"),
      sender: boundedString(LIMITS.SHORT_STRING, "sender"),
      lane: triageLaneSchema,
    })
  ),
});
