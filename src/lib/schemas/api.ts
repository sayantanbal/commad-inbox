import { z } from "zod";
import { AI_PROVIDER_IDS } from "@/lib/ai/providers";
import { draftToneSchema, threadIdField, triageLaneSchema } from "@/lib/schemas/domain";
import { LIMITS } from "@/lib/schemas/limits";
import {
  boundedString,
  emailOrListSchema,
  nonEmptyBoundedString,
  strictObject,
  timeSlotSchema,
  uiMessageSchema,
  uuidArraySchema,
  weekdayKeySchema,
} from "@/lib/schemas/primitives";

export const aiProviderSchema = z.enum(AI_PROVIDER_IDS);

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
  to: z
    .array(z.string().email({ message: "to must contain valid email addresses" }))
    .min(1, { message: "At least one recipient is required" })
    .max(LIMITS.EMAIL_RECIPIENTS),
  subject: nonEmptyBoundedString(LIMITS.EMAIL_SUBJECT, "subject"),
  body: nonEmptyBoundedString(LIMITS.EMAIL_BODY, "body"),
  threadId: threadIdField.optional(),
  sendAt: z.string().datetime({ message: "sendAt must be an ISO 8601 datetime" }).optional(),
  attachmentIds: uuidArraySchema.optional(),
});

export const scheduledSendIdBodySchema = strictObject({
  scheduledSendId: nonEmptyBoundedString(LIMITS.SCHEDULED_SEND_ID, "scheduledSendId"),
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
  query: nonEmptyBoundedString(LIMITS.SEARCH_QUERY, "query"),
  limit: z
    .number()
    .int({ message: "limit must be a whole number" })
    .min(1, { message: "limit must be at least 1" })
    .max(50, { message: "limit must be at most 50" })
    .default(20),
  provider: aiProviderSchema.default("openai"),
});

export const advancedSearchBodySchema = strictObject({
  query: boundedString(LIMITS.SEARCH_QUERY, "query").optional(),
  sender: boundedString(LIMITS.SENDER_FILTER, "sender").optional(),
  after: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
  hasAttachment: z.boolean().optional(),
  lane: triageLaneSchema.optional(),
  limit: z.number().int().min(1).max(50).default(30),
}).refine(
  (data) =>
    Boolean(
      data.query?.trim() ||
        data.sender?.trim() ||
        data.after ||
        data.before ||
        data.hasAttachment !== undefined ||
        data.lane
    ),
  { message: "At least one search filter is required" }
);

export const agentChatBodySchema = strictObject({
  messages: z.array(uiMessageSchema).max(LIMITS.MESSAGES).default([]),
  provider: aiProviderSchema.default("openai"),
  conversationId: nonEmptyBoundedString(LIMITS.CONVERSATION_ID, "conversationId").optional(),
  mentionedContacts: z
    .array(
      strictObject({
        email: z.string().email(),
        displayName: nonEmptyBoundedString(LIMITS.DISPLAY_NAME, "displayName"),
      })
    )
    .max(LIMITS.MENTIONED_CONTACTS)
    .optional(),
  pendingAttachmentIds: uuidArraySchema.optional(),
  openThread: strictObject({
    threadId: threadIdField,
    attachments: z
      .array(
        strictObject({
          messageId: nonEmptyBoundedString(LIMITS.MESSAGE_ID, "messageId"),
          attachmentId: nonEmptyBoundedString(LIMITS.ATTACHMENT_ID, "attachmentId"),
          filename: nonEmptyBoundedString(LIMITS.FILENAME, "filename"),
          mimeType: nonEmptyBoundedString(LIMITS.MIME_TYPE, "mimeType"),
          sizeBytes: z.number().int().nonnegative().max(25 * 1024 * 1024),
        })
      )
      .max(LIMITS.OPEN_THREAD_ATTACHMENTS),
  }).optional(),
});

export const outboundAttachmentFromThreadBodySchema = strictObject({
  messageId: nonEmptyBoundedString(LIMITS.MESSAGE_ID, "messageId"),
  attachmentId: nonEmptyBoundedString(LIMITS.ATTACHMENT_ID, "attachmentId"),
  filename: nonEmptyBoundedString(LIMITS.FILENAME, "filename"),
  mimeType: nonEmptyBoundedString(LIMITS.MIME_TYPE, "mimeType"),
  sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
});

export const conversationIdBodySchema = strictObject({
  conversationId: nonEmptyBoundedString(LIMITS.CONVERSATION_ID, "conversationId"),
});

export const threadSummaryBodySchema = strictObject({
  threadId: threadIdField,
  provider: aiProviderSchema.default("openai"),
});

export const saveConversationBodySchema = strictObject({
  messages: z.array(uiMessageSchema).max(LIMITS.MESSAGES),
});

export const focusBlockBodySchema = strictObject({
  start: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(90),
  summary: nonEmptyBoundedString(120, "summary").optional(),
});

export const focusBlockDeleteBodySchema = strictObject({
  eventId: nonEmptyBoundedString(LIMITS.EVENT_ID, "eventId"),
});

export const reembedBodySchema = strictObject({
  provider: aiProviderSchema,
});

export const dailyBriefBodySchema = strictObject({
  provider: aiProviderSchema.optional(),
  refresh: z.boolean().optional(),
  stream: z.boolean().optional(),
  timezone: nonEmptyBoundedString(LIMITS.TIMEZONE, "timezone").optional(),
});

/** yyyy-MM month filter for calendar events. */
export const eventsMonthQuerySchema = strictObject({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in yyyy-MM format")
    .optional(),
});

export const conversationIdParamSchema = nonEmptyBoundedString(LIMITS.CONVERSATION_ID, "conversationId");

export const commitmentPatchBodySchema = strictObject({
  commitmentId: nonEmptyBoundedString(LIMITS.COMMITMENT_ID, "commitmentId"),
  status: z.enum(["open", "fulfilled", "dismissed"]),
});

export const commitmentConfirmBodySchema = strictObject({
  commitmentId: nonEmptyBoundedString(LIMITS.COMMITMENT_ID, "commitmentId"),
});

export const preBriefQuerySchema = strictObject({
  attendeeEmail: z.string().email(),
  threadId: threadIdField.optional(),
});

const workingDaySlotSchema = strictObject({
  enabled: z.boolean(),
  start: timeSlotSchema,
  end: timeSlotSchema,
});

export const workingDaysStructuredSchema = strictObject({
  timezone: nonEmptyBoundedString(LIMITS.TIMEZONE, "timezone"),
  days: z.record(weekdayKeySchema, workingDaySlotSchema),
});

export const preferencesPatchBodySchema = strictObject({
  batchWindows: z.array(timeSlotSchema).min(1).max(LIMITS.BATCH_TIME_SLOTS).optional(),
  focusModeEnabled: z.boolean().optional(),
  autoResponderTemplate: nonEmptyBoundedString(LIMITS.AUTO_RESPONDER, "autoResponderTemplate").optional(),
  followUpDaysDefault: z.number().int().min(1).max(30).optional(),
  timezone: nonEmptyBoundedString(LIMITS.TIMEZONE, "timezone").optional(),
  workingDaysStructured: workingDaysStructuredSchema.nullable().optional(),
  workingDaysTextOverride: boundedString(LIMITS.WORKING_DAYS_TEXT, "workingDaysTextOverride")
    .nullable()
    .optional(),
  workingDaysSource: z.enum(["wizard", "override"]).optional(),
  onboardingCompletedAt: z.string().datetime().nullable().optional(),
});

export const contactBodySchema = strictObject({
  email: z.string().email(),
  displayName: nonEmptyBoundedString(LIMITS.DISPLAY_NAME, "displayName").optional(),
});

export const contactDismissBodySchema = strictObject({
  email: z.string().email(),
});

export const googleContactsDisconnectBodySchema = strictObject({
  removeImported: z.boolean().optional(),
});

export const appContactsListQuerySchema = strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(LIMITS.PAGE_SIZE_MAX).default(20),
  q: boundedString(LIMITS.SEARCH_QUERY, "q").optional(),
});

export const calendarEventPatchBodySchema = strictObject({
  eventId: nonEmptyBoundedString(LIMITS.EVENT_ID, "eventId"),
  slotStart: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
});

export const contactsImportJsonBodySchema = strictObject({
  source: z.enum(["gmail-sent", "google-contacts", "demo-contacts"]).optional(),
  emails: z.array(z.string().email()).max(LIMITS.IMPORT_EMAILS).optional(),
  text: boundedString(LIMITS.CONTACT_IMPORT_TEXT, "text").optional(),
}).superRefine((data, ctx) => {
  const hasSource = data.source != null;
  const hasEmailsField = data.emails != null;
  const hasNonEmptyEmails = (data.emails?.length ?? 0) > 0;
  const hasText = Boolean(data.text?.trim());

  if (hasEmailsField && !hasNonEmptyEmails) {
    ctx.addIssue({
      code: "custom",
      message: "emails cannot be an empty array",
      path: ["emails"],
    });
    return;
  }

  const isCompletelyEmpty = !hasSource && !hasEmailsField && data.text == null;
  if (isCompletelyEmpty) return;

  const hasValidPayload = hasSource || hasNonEmptyEmails || hasText;
  if (!hasValidPayload) {
    ctx.addIssue({
      code: "custom",
      message: "Provide source, emails, or text",
      path: ["source"],
    });
  }
});

export const snippetBodySchema = strictObject({
  name: nonEmptyBoundedString(80, "name"),
  body: nonEmptyBoundedString(LIMITS.LONG_STRING, "body"),
});

export const snippetIdBodySchema = strictObject({
  snippetId: nonEmptyBoundedString(LIMITS.SNIPPET_ID, "snippetId"),
});

export const exportTaskBodySchema = strictObject({
  threadId: threadIdField,
  title: nonEmptyBoundedString(LIMITS.SHORT_STRING, "title"),
  description: nonEmptyBoundedString(LIMITS.LONG_STRING, "description"),
  teamId: nonEmptyBoundedString(LIMITS.LINEAR_ID, "teamId").optional(),
  projectId: nonEmptyBoundedString(LIMITS.LINEAR_ID, "projectId").optional(),
});

export const sendTimeSuggestBodySchema = strictObject({
  counterpartyEmail: z.string().email(),
  threadId: threadIdField.optional(),
});

export const linearConnectBodySchema = strictObject({
  accessToken: nonEmptyBoundedString(LIMITS.ACCESS_TOKEN, "accessToken"),
  teamId: nonEmptyBoundedString(LIMITS.LINEAR_ID, "teamId").optional(),
  defaultProjectId: nonEmptyBoundedString(LIMITS.LINEAR_ID, "defaultProjectId").optional(),
});

export const aiKeyBodySchema = strictObject({
  provider: aiProviderSchema,
  apiKey: z.string().trim().min(8).max(LIMITS.API_KEY),
});

export const aiKeyDeleteQuerySchema = strictObject({
  provider: aiProviderSchema,
});
