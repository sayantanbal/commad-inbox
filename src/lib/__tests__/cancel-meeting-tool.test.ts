import { describe, expect, test } from "bun:test";
import {
  cancelMeetingWithNoticeToolInputSchema,
  cancelMeetingWithNoticeToolOutputSchema,
} from "@/lib/schemas/agent-tools";

describe("cancelMeetingWithNoticeTool schemas", () => {
  test("accepts threadId input", () => {
    const parsed = cancelMeetingWithNoticeToolInputSchema.safeParse({
      threadId: "thread-abc",
    });
    expect(parsed.success).toBe(true);
  });

  test("accepts structured output", () => {
    const parsed = cancelMeetingWithNoticeToolOutputSchema.safeParse({
      threadId: "thread-abc",
      eventId: "evt-1",
      scheduledSendId: "550e8400-e29b-41d4-a716-446655440000",
      summary: "Queued cancellation",
    });
    expect(parsed.success).toBe(true);
  });
});
