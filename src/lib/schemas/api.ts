import { z } from "zod";
import { draftToneSchema, threadIdField, triageLaneSchema } from "@/lib/schemas/domain";

export const aiProviderSchema = z.enum(["gemini", "openai"]);

function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export const archiveBodySchema = strictObject({
  threadId: threadIdField,
});

export const snoozeBodySchema = strictObject({
  threadId: threadIdField,
  until: z.string().datetime({ message: "until must be an ISO 8601 datetime" }),
});

export const snoozeCancelBodySchema = strictObject({
  threadId: threadIdField,
});

export const restoreBodySchema = strictObject({
  threadId: threadIdField,
  lane: triageLaneSchema,
});

export const draftBodySchema = strictObject({
  threadId: threadIdField,
  tone: draftToneSchema.default("professional"),
  provider: aiProviderSchema.optional(),
});

export const sendBodySchema = strictObject({
  to: z.array(z.string().email({ message: "to must contain valid email addresses" })).min(1, {
    message: "At least one recipient is required",
  }),
  subject: z.string().min(1, "subject is required"),
  body: z.string().min(1, "body is required"),
  threadId: threadIdField.optional(),
  sendAt: z.string().datetime({ message: "sendAt must be an ISO 8601 datetime" }).optional(),
});

export const scheduledSendIdBodySchema = strictObject({
  scheduledSendId: z.string().min(1, "scheduledSendId is required"),
});

export const meetingCreateBodySchema = strictObject({
  threadId: threadIdField,
  slotStart: z.string().datetime({ message: "slotStart must be an ISO 8601 datetime" }),
  durationMinutes: z
    .number()
    .int({ message: "durationMinutes must be a whole number" })
    .min(15, { message: "durationMinutes must be at least 15" })
    .max(240, { message: "durationMinutes must be at most 240" })
    .optional(),
});

export const meetingCancelBodySchema = strictObject({
  threadId: threadIdField,
});

export const searchBodySchema = strictObject({
  query: z
    .string()
    .min(1, "query is required")
    .max(500, "query must be at most 500 characters"),
  limit: z
    .number()
    .int({ message: "limit must be a whole number" })
    .min(1, { message: "limit must be at least 1" })
    .max(50, { message: "limit must be at most 50" })
    .default(20),
  provider: aiProviderSchema.default("openai"),
});

export const advancedSearchBodySchema = strictObject({
  query: z.string().max(500).optional(),
  sender: z.string().max(200).optional(),
  after: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
  hasAttachment: z.boolean().optional(),
  lane: triageLaneSchema.optional(),
  limit: z.number().int().min(1).max(50).default(30),
});

const uiMessagePartSchema = z
  .object({
    type: z.string().min(1, "message part type is required"),
  })
  .passthrough();

const uiMessageSchema = z.object({
  id: z.string().min(1, "message id is required"),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(uiMessagePartSchema).min(1, "message must include at least one part"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const agentChatBodySchema = strictObject({
  messages: z.array(uiMessageSchema).default([]),
  provider: aiProviderSchema.default("openai"),
  conversationId: z.string().min(1).optional(),
});

export const conversationIdBodySchema = strictObject({
  conversationId: z.string().min(1, "conversationId is required"),
});

export const threadSummaryBodySchema = strictObject({
  threadId: threadIdField,
  provider: aiProviderSchema.default("openai"),
});

export const saveConversationBodySchema = strictObject({
  messages: z.array(uiMessageSchema),
});

export const focusBlockBodySchema = strictObject({
  start: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(90),
  summary: z.string().trim().min(1).max(120).optional(),
});

export const focusBlockDeleteBodySchema = strictObject({
  eventId: z.string().min(1),
});

export const reembedBodySchema = strictObject({
  provider: aiProviderSchema,
});
