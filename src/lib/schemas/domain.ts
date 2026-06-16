import { z } from "zod";
import { LIMITS } from "@/lib/schemas/limits";
import { boundedString, nonEmptyBoundedString, strictObject } from "@/lib/schemas/primitives";

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
export const threadIdField = nonEmptyBoundedString(LIMITS.THREAD_ID, "threadId");

/**
 * Scheduling intent as stored in Postgres / returned by the classifier.
 * Times are ISO 8601 strings until mapped to Date for UI.
 */
export const schedulingIntentStoredSchema = strictObject({
  proposedTimes: z
    .array(
      z.string().datetime({ message: "proposedTimes entries must be ISO 8601 datetimes" })
    )
    .min(1)
    .max(10),
  attendees: z
    .array(z.string().email({ message: "attendees must be valid email addresses" }))
    .max(LIMITS.EMAIL_RECIPIENTS),
  duration: z
    .number()
    .int({ message: "duration must be a whole number of minutes" })
    .positive({ message: "duration must be positive" })
    .max(480, { message: "duration must be at most 480 minutes" }),
  confidence: z
    .number()
    .min(0, { message: "confidence must be between 0 and 1" })
    .max(1, { message: "confidence must be between 0 and 1" }),
});

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

export const suggestedActionSchema = strictObject({
  label: nonEmptyBoundedString(LIMITS.AI_ACTION_LABEL, "label"),
  type: suggestedActionTypeSchema,
  threadId: threadIdField.optional(),
  draftText: boundedString(LIMITS.AI_DRAFT_TEXT, "draftText").optional(),
});

export type SuggestedAction = z.infer<typeof suggestedActionSchema>;

export const aiSummarySchema = strictObject({
  bullets: z
    .array(nonEmptyBoundedString(LIMITS.AI_SUMMARY_BULLET, "bullet"))
    .min(1)
    .max(6),
  actions: z.array(suggestedActionSchema).max(LIMITS.BRIEF_ACTIONS),
});

export type AiSummary = z.infer<typeof aiSummarySchema>;

export const dailyBriefItemSchema = strictObject({
  label: nonEmptyBoundedString(LIMITS.AI_ACTION_LABEL, "label"),
  text: nonEmptyBoundedString(LIMITS.AI_SUMMARY_BULLET, "text"),
  actions: z.array(suggestedActionSchema).max(3).optional(),
});

export const dailyBriefSchema = strictObject({
  greeting: nonEmptyBoundedString(LIMITS.AI_LABEL, "greeting"),
  subtitle: nonEmptyBoundedString(LIMITS.AI_LABEL, "subtitle"),
  items: z.array(dailyBriefItemSchema).min(1).max(LIMITS.BRIEF_ITEMS),
});

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

export const extractedCommitmentSchema = strictObject({
  text: nonEmptyBoundedString(LIMITS.MEDIUM_STRING, "text"),
  direction: commitmentDirectionSchema,
  counterpartyEmail: z.string().email(),
  dueDate: z.string().datetime().nullable(),
  confidence: z.number().min(0).max(1),
});

export type ExtractedCommitment = z.infer<typeof extractedCommitmentSchema>;

export const commitmentExtractionResultSchema = strictObject({
  commitments: z.array(extractedCommitmentSchema).max(LIMITS.COMMITMENTS),
});

export type CommitmentExtractionResult = z.infer<typeof commitmentExtractionResultSchema>;

export const CONTACT_WARMTH = ["cold", "warm", "active", "new"] as const;
export type ContactWarmth = (typeof CONTACT_WARMTH)[number];
export const contactWarmthSchema = z.enum(CONTACT_WARMTH);

export const meetingBriefThreadSchema = strictObject({
  subject: boundedString(LIMITS.EMAIL_SUBJECT, "subject"),
  snippet: boundedString(LIMITS.MEDIUM_STRING, "snippet"),
  date: boundedString(LIMITS.SHORT_STRING, "date"),
});

export const meetingBriefStoredSchema = strictObject({
  attendeeName: nonEmptyBoundedString(LIMITS.DISPLAY_NAME, "attendeeName"),
  attendeeEmail: z.string().email(),
  recentThreads: z.array(meetingBriefThreadSchema).max(3),
  openCommitments: z
    .array(nonEmptyBoundedString(LIMITS.MEDIUM_STRING, "commitment"))
    .max(5),
  attachmentsNote: boundedString(LIMITS.MEDIUM_STRING, "attachmentsNote"),
  toneSummary: boundedString(LIMITS.MEDIUM_STRING, "toneSummary"),
});

export type MeetingBriefStored = z.infer<typeof meetingBriefStoredSchema>;

export const sendTimeSuggestionSchema = strictObject({
  suggestedAt: z.string().datetime(),
  reason: nonEmptyBoundedString(LIMITS.MEDIUM_STRING, "reason"),
  confidence: z.enum(["high", "medium", "low"]),
});

export type SendTimeSuggestion = z.infer<typeof sendTimeSuggestionSchema>;

/** Stored / validated classifier result (schedulingIntent may be null). */
export const classificationResultSchema = strictObject({
  priority: prioritySchema,
  lane: triageLaneSchema,
  schedulingIntent: schedulingIntentStoredSchema.nullable(),
});

export type ClassificationResult = z.infer<typeof classificationResultSchema>;

/**
 * Schema sent to structured-output APIs (OpenAI Responses, Gemini).
 * Must use explicit types only — z.unknown() and .nullable() break OpenAI's
 * JSON-schema validator (anyOf branch missing `type`).
 * Omit schedulingIntent when there is no meeting intent.
 */
export const classificationAiOutputSchema = strictObject({
  priority: prioritySchema,
  lane: triageLaneSchema,
  schedulingIntent: schedulingIntentStoredSchema.optional(),
});

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
