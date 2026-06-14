import { z } from "zod";

const TRIAGE_LANES = ["reply", "schedule", "fyi", "done"] as const;
export type TriageLane = (typeof TRIAGE_LANES)[number];
export const triageLaneSchema = z.enum(TRIAGE_LANES);

const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const prioritySchema = z.enum(PRIORITIES);

const DRAFT_TONES = ["professional", "friendly", "brief"] as const;
export type DraftTone = (typeof DRAFT_TONES)[number];
export const draftToneSchema = z.enum(DRAFT_TONES);

/** Gmail thread id from API clients. */
export const threadIdField = z.string().min(1, "threadId is required");

/**
 * Scheduling intent as stored in Postgres / returned by the classifier.
 * Times are ISO 8601 strings until mapped to Date for UI.
 */
export const schedulingIntentStoredSchema = z
  .object({
    proposedTimes: z.array(
      z.string().datetime({ message: "proposedTimes entries must be ISO 8601 datetimes" })
    ),
    attendees: z.array(z.string().email({ message: "attendees must be valid email addresses" })),
    duration: z
      .number()
      .int({ message: "duration must be a whole number of minutes" })
      .positive({ message: "duration must be positive" })
      .max(480, { message: "duration must be at most 480 minutes" }),
    confidence: z
      .number()
      .min(0, { message: "confidence must be between 0 and 1" })
      .max(1, { message: "confidence must be between 0 and 1" }),
  })
  .strict();

export type SchedulingIntentStored = z.infer<typeof schedulingIntentStoredSchema>;

export const suggestedActionTypeSchema = z.enum([
  "reply",
  "archive",
  "schedule",
  "snooze",
  "compose",
  "open_thread",
]);

export type SuggestedActionType = z.infer<typeof suggestedActionTypeSchema>;

export const suggestedActionSchema = z
  .object({
    label: z.string().min(1),
    type: suggestedActionTypeSchema,
    threadId: threadIdField.optional(),
    draftText: z.string().optional(),
  })
  .strict();

export type SuggestedAction = z.infer<typeof suggestedActionSchema>;

export const aiSummarySchema = z
  .object({
    bullets: z.array(z.string()).min(1).max(6),
    actions: z.array(suggestedActionSchema).max(4),
  })
  .strict();

export type AiSummary = z.infer<typeof aiSummarySchema>;

export const dailyBriefItemSchema = z
  .object({
    label: z.string().min(1),
    text: z.string().min(1),
    actions: z.array(suggestedActionSchema).max(3).optional(),
  })
  .strict();

export const dailyBriefSchema = z
  .object({
    greeting: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(dailyBriefItemSchema).min(1).max(8),
  })
  .strict();

export type DailyBrief = z.infer<typeof dailyBriefSchema>;
export type DailyBriefItem = z.infer<typeof dailyBriefItemSchema>;

export const COMMITMENT_DIRECTIONS = ["outbound", "inbound"] as const;
export type CommitmentDirection = (typeof COMMITMENT_DIRECTIONS)[number];
export const commitmentDirectionSchema = z.enum(COMMITMENT_DIRECTIONS);

export const COMMITMENT_STATUSES = [
  "pending_confirm",
  "open",
  "fulfilled",
  "dismissed",
] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];
export const commitmentStatusSchema = z.enum(COMMITMENT_STATUSES);

export const extractedCommitmentSchema = z
  .object({
    text: z.string().min(1),
    direction: commitmentDirectionSchema,
    counterpartyEmail: z.string().email(),
    dueDate: z.string().datetime().nullable(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type ExtractedCommitment = z.infer<typeof extractedCommitmentSchema>;

export const commitmentExtractionResultSchema = z
  .object({
    commitments: z.array(extractedCommitmentSchema).max(3),
  })
  .strict();

export type CommitmentExtractionResult = z.infer<typeof commitmentExtractionResultSchema>;

export const CONTACT_WARMTH = ["cold", "warm", "active", "new"] as const;
export type ContactWarmth = (typeof CONTACT_WARMTH)[number];
export const contactWarmthSchema = z.enum(CONTACT_WARMTH);

export const meetingBriefThreadSchema = z
  .object({
    subject: z.string(),
    snippet: z.string(),
    date: z.string(),
  })
  .strict();

export const meetingBriefStoredSchema = z
  .object({
    attendeeName: z.string(),
    attendeeEmail: z.string().email(),
    recentThreads: z.array(meetingBriefThreadSchema).max(3),
    openCommitments: z.array(z.string()).max(5),
    attachmentsNote: z.string(),
    toneSummary: z.string(),
  })
  .strict();

export type MeetingBriefStored = z.infer<typeof meetingBriefStoredSchema>;

export const sendTimeSuggestionSchema = z
  .object({
    suggestedAt: z.string().datetime(),
    reason: z.string().min(1),
    confidence: z.enum(["high", "medium", "low"]),
  })
  .strict();

export type SendTimeSuggestion = z.infer<typeof sendTimeSuggestionSchema>;

/** Stored / validated classifier result (schedulingIntent may be null). */
export const classificationResultSchema = z
  .object({
    priority: prioritySchema,
    lane: triageLaneSchema,
    schedulingIntent: schedulingIntentStoredSchema.nullable(),
  })
  .strict();

export type ClassificationResult = z.infer<typeof classificationResultSchema>;

/**
 * Schema sent to structured-output APIs (OpenAI Responses, Gemini).
 * Must use explicit types only — z.unknown() and .nullable() break OpenAI's
 * JSON-schema validator (anyOf branch missing `type`).
 * Omit schedulingIntent when there is no meeting intent.
 */
export const classificationAiOutputSchema = z
  .object({
    priority: prioritySchema,
    lane: triageLaneSchema,
    schedulingIntent: schedulingIntentStoredSchema.optional(),
  })
  .strict();

export type ClassificationAiOutput = z.infer<typeof classificationAiOutputSchema>;

export function sanitizeClassificationResult(
  data: ClassificationAiOutput
): ClassificationResult {
  if (data.schedulingIntent == null) {
    return { priority: data.priority, lane: data.lane, schedulingIntent: null };
  }

  const parsed = schedulingIntentStoredSchema.safeParse(data.schedulingIntent);
  return {
    priority: data.priority,
    lane: data.lane,
    schedulingIntent: parsed.success ? parsed.data : null,
  };
}

export const DEFAULT_CLASSIFICATION_RESULT: ClassificationResult = {
  priority: "medium",
  lane: "reply",
  schedulingIntent: null,
};
