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

/** Gemini classifier JSON output. */
export const classificationResultSchema = z
  .object({
    priority: prioritySchema,
    lane: triageLaneSchema,
    schedulingIntent: schedulingIntentStoredSchema.nullable(),
  })
  .strict();

export type ClassificationResult = z.infer<typeof classificationResultSchema>;

export const DEFAULT_CLASSIFICATION_RESULT: ClassificationResult = {
  priority: "medium",
  lane: "reply",
  schedulingIntent: null,
};
