import { z } from "zod";
import { threadIdField } from "@/lib/schemas/domain";

export const sendEmailToolInputSchema = z
  .object({
    to: z.union([
      z.string().email({ message: "to must be a valid email address" }),
      z.array(z.string().email()).min(1, { message: "to must include at least one email" }),
    ]),
    subject: z.string().min(1, "subject is required"),
    body: z.string().min(1, "body is required"),
    threadId: threadIdField.optional(),
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
