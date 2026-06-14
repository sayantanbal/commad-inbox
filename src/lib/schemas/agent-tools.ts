import { z } from "zod";
import { threadIdField } from "@/lib/schemas/domain";

const emailOrList = z.union([
  z.string().email({ message: "must be a valid email address" }),
  z.array(z.string().email()).min(1),
]);

export const sendEmailToolInputSchema = z
  .object({
    to: emailOrList,
    cc: emailOrList.optional(),
    bcc: emailOrList.optional(),
    subject: z.string().min(1, "subject is required"),
    body: z.string().min(1, "body is required"),
    threadId: threadIdField.optional(),
  })
  .strict();

export const scheduleSendToolInputSchema = z
  .object({
    to: emailOrList,
    cc: emailOrList.optional(),
    bcc: emailOrList.optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    sendAt: z.string().datetime({ message: "sendAt must be ISO 8601 datetime" }),
    threadId: threadIdField.optional(),
  })
  .strict();

export const listCalendarEventsToolInputSchema = z
  .object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  })
  .strict();

export const rescheduleCalendarEventToolInputSchema = z
  .object({
    eventId: z.string().min(1),
    start: z.string().datetime(),
    durationMinutes: z.number().int().min(15).max(240).default(30),
  })
  .strict();

export const cancelCalendarEventToolInputSchema = z
  .object({
    eventId: z.string().min(1),
  })
  .strict();

export const createCalendarInviteToolInputSchema = z
  .object({
    summary: z.string().min(1, "summary is required"),
    start: z.string().datetime({ message: "start must be an ISO 8601 datetime" }),
    durationMinutes: z
      .number()
      .int({ message: "durationMinutes must be a whole number" })
      .min(15, { message: "durationMinutes must be at least 15" })
      .max(240, { message: "durationMinutes must be at most 240" })
      .default(30),
    attendees: z
      .array(z.string().email({ message: "attendees must be valid email addresses" }))
      .min(1, { message: "at least one attendee is required" }),
    description: z.string().optional(),
  })
  .strict();
