import { z } from "zod";
import { LIMITS } from "@/lib/schemas/limits";

export type BoundedJsonValue =
  | string
  | number
  | boolean
  | null
  | BoundedJsonValue[]
  | { [key: string]: BoundedJsonValue };

function boundedJsonAtDepth(depth: number): z.ZodType<BoundedJsonValue> {
  const scalar = z.union([
    z.string().max(LIMITS.LONG_STRING),
    z.number().finite(),
    z.boolean(),
    z.null(),
  ]);

  if (depth <= 0) {
    return scalar;
  }

  const nested = z.lazy(() => boundedJsonAtDepth(depth - 1));

  return z.union([
    scalar,
    z.array(nested).max(LIMITS.JSON_ARRAY),
    z
      .record(z.string().max(LIMITS.METADATA_KEY_LENGTH), nested)
      .refine((value) => Object.keys(value).length <= LIMITS.JSON_KEYS, {
        message: "object has too many keys",
      }),
  ]);
}

/** JSON-like values with depth, key-count, and string-size bounds (replaces z.unknown()). */
export const boundedJsonValue = boundedJsonAtDepth(LIMITS.JSON_DEPTH);

/** Small metadata maps on UI messages and tool invocations. */
export const metadataRecordSchema = z
  .record(z.string().max(LIMITS.METADATA_KEY_LENGTH), boundedJsonValue)
  .refine((value) => Object.keys(value).length <= LIMITS.METADATA_KEYS, {
    message: "metadata has too many keys",
  });

export function boundedString(max: number, label = "value") {
  return z.string().max(max, { message: `${label} must be at most ${max} characters` });
}

export function nonEmptyBoundedString(max: number, label = "value") {
  return z
    .string()
    .trim()
    .min(1, { message: `${label} is required` })
    .max(max, { message: `${label} must be at most ${max} characters` });
}

export function emailListSchema(maxRecipients = LIMITS.EMAIL_RECIPIENTS) {
  return z
    .array(z.string().email({ message: "must be a valid email address" }))
    .min(1, { message: "at least one email is required" })
    .max(maxRecipients, { message: `at most ${maxRecipients} recipients allowed` });
}

export const emailOrListSchema = z.union([
  z.string().email({ message: "must be a valid email address" }),
  emailListSchema(),
]);

export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export const uuidArraySchema = z
  .array(z.string().uuid())
  .max(LIMITS.UUID_ARRAY, { message: `at most ${LIMITS.UUID_ARRAY} ids allowed` });

export const timeSlotSchema = z.string().regex(/^\d{2}:\d{2}$/, "time must be in HH:MM format");

export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const weekdayKeySchema = z.enum(WEEKDAY_KEYS);

const toolInvocationStateSchema = z.enum([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
  "output-available",
  "output-error",
  "output-denied",
]);

const approvalBlockSchema = z
  .object({
    id: z.string().max(LIMITS.TOOL_CALL_ID),
    approved: z.boolean().optional(),
    reason: boundedString(LIMITS.MEDIUM_STRING, "approval reason").optional(),
    signature: boundedString(LIMITS.MEDIUM_STRING, "approval signature").optional(),
  })
  .strict();

const textPartSchema = strictObject({
  type: z.literal("text"),
  text: nonEmptyBoundedString(LIMITS.MESSAGE_TEXT, "text"),
  state: z.enum(["streaming", "done"]).optional(),
  providerMetadata: metadataRecordSchema.optional(),
});

const reasoningPartSchema = strictObject({
  type: z.literal("reasoning"),
  text: nonEmptyBoundedString(LIMITS.MESSAGE_TEXT, "reasoning text"),
  state: z.enum(["streaming", "done"]).optional(),
  providerMetadata: metadataRecordSchema.optional(),
});

const stepStartPartSchema = strictObject({
  type: z.literal("step-start"),
});

const filePartSchema = strictObject({
  type: z.literal("file"),
  mediaType: nonEmptyBoundedString(LIMITS.MIME_TYPE, "mediaType"),
  filename: boundedString(LIMITS.FILENAME, "filename").optional(),
  url: nonEmptyBoundedString(LIMITS.URL, "url"),
  providerMetadata: metadataRecordSchema.optional(),
});

const sourceUrlPartSchema = strictObject({
  type: z.literal("source-url"),
  sourceId: nonEmptyBoundedString(LIMITS.TOOL_CALL_ID, "sourceId"),
  url: nonEmptyBoundedString(LIMITS.URL, "url"),
  title: boundedString(LIMITS.AI_LABEL, "title").optional(),
  providerMetadata: metadataRecordSchema.optional(),
});

const sourceDocumentPartSchema = strictObject({
  type: z.literal("source-document"),
  sourceId: nonEmptyBoundedString(LIMITS.TOOL_CALL_ID, "sourceId"),
  mediaType: nonEmptyBoundedString(LIMITS.MIME_TYPE, "mediaType"),
  title: nonEmptyBoundedString(LIMITS.AI_LABEL, "title"),
  filename: boundedString(LIMITS.FILENAME, "filename").optional(),
  providerMetadata: metadataRecordSchema.optional(),
});

const dataPartSchema = strictObject({
  type: z.string().regex(/^data-[a-z0-9_-]+$/, "invalid data part type"),
  id: boundedString(LIMITS.TOOL_CALL_ID, "id").optional(),
  data: boundedJsonValue,
});

const toolLikePartSchema = strictObject({
  type: z.string().regex(/^(tool-[a-z0-9_]+|dynamic-tool)$/, "invalid tool part type"),
  toolCallId: nonEmptyBoundedString(LIMITS.TOOL_CALL_ID, "toolCallId"),
  toolName: boundedString(LIMITS.TOOL_NAME, "toolName").optional(),
  title: boundedString(LIMITS.AI_LABEL, "title").optional(),
  toolMetadata: metadataRecordSchema.optional(),
  providerExecuted: z.boolean().optional(),
  state: toolInvocationStateSchema,
  input: boundedJsonValue.optional(),
  output: boundedJsonValue.optional(),
  errorText: boundedString(LIMITS.TOOL_ERROR_TEXT, "errorText").optional(),
  approval: approvalBlockSchema.optional(),
  callProviderMetadata: metadataRecordSchema.optional(),
  resultProviderMetadata: metadataRecordSchema.optional(),
  preliminary: z.boolean().optional(),
  rawInput: boundedJsonValue.optional(),
}).superRefine((value, ctx) => {
  if (value.type === "dynamic-tool" && !value.toolName?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "toolName is required for dynamic-tool parts",
      path: ["toolName"],
    });
  }
});

/** AI SDK UIMessage parts with strict shapes and bounded nested JSON. */
export const uiMessagePartSchema = z.union([
  textPartSchema,
  reasoningPartSchema,
  stepStartPartSchema,
  filePartSchema,
  sourceUrlPartSchema,
  sourceDocumentPartSchema,
  dataPartSchema,
  toolLikePartSchema,
]);

export const uiMessageSchema = strictObject({
  id: nonEmptyBoundedString(LIMITS.TOOL_CALL_ID, "message id"),
  role: z.enum(["system", "user", "assistant"]),
  parts: z
    .array(uiMessagePartSchema)
    .min(1, "message must include at least one part")
    .max(LIMITS.MESSAGE_PARTS),
  metadata: metadataRecordSchema.optional(),
});
