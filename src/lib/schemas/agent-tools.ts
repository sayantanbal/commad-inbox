import { z } from "zod";
import { threadIdField } from "@/lib/schemas/domain";
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
