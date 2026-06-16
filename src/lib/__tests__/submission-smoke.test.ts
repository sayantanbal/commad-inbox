import { describe, expect, test } from "bun:test";
import {
  createCalendarInviteToolInputSchema,
  listCalendarEventsToolInputSchema,
  sendEmailToolInputSchema,
} from "@/lib/schemas/agent-tools";
import { webhookTenantIdSchema } from "@/lib/schemas/webhooks";
import { buildGmailSearchQuery } from "@/lib/search/gmail-query";

describe("webhookTenantIdSchema", () => {
  test("accepts non-empty tenant id", () => {
    expect(webhookTenantIdSchema.safeParse("user-123").success).toBe(true);
  });

  test("rejects empty or missing tenant id", () => {
    expect(webhookTenantIdSchema.safeParse("").success).toBe(false);
    expect(webhookTenantIdSchema.safeParse(null).success).toBe(false);
  });
});

describe("sendEmailToolInputSchema", () => {
  test("accepts valid single-recipient payload", () => {
    const result = sendEmailToolInputSchema.safeParse({
      to: "friend@corsair.dev",
      subject: "Looking forward to our meeting",
      body: "Hi — see you Thursday at 9.",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = sendEmailToolInputSchema.safeParse({
      to: "not-an-email",
      subject: "Hi",
      body: "Hello",
    });
    expect(result.success).toBe(false);
  });

  test("accepts optional attachmentIds", () => {
    const result = sendEmailToolInputSchema.safeParse({
      to: "friend@corsair.dev",
      subject: "Files attached",
      body: "See attached.",
      attachmentIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });
});

describe("createCalendarInviteToolInputSchema", () => {
  test("accepts valid invite payload", () => {
    const result = createCalendarInviteToolInputSchema.safeParse({
      summary: "Sync with friend",
      start: "2026-06-19T09:00:00.000Z",
      attendees: ["friend@corsair.dev"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationMinutes).toBe(30);
      expect(result.data.start).toBe("2026-06-19T09:00:00.000Z");
    }
  });

  test("accepts timezone offset datetimes from the model", () => {
    const result = createCalendarInviteToolInputSchema.safeParse({
      summary: "Record demo video",
      start: "2026-06-16T16:00:00+05:30",
      durationMinutes: 60,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.start).toBe("2026-06-16T10:30:00.000Z");
      expect(result.data.attendees).toEqual([]);
    }
  });

  test("accepts personal reminder with no attendees", () => {
    const result = createCalendarInviteToolInputSchema.safeParse({
      summary: "Reminder",
      start: "2026-06-16T16:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attendees).toEqual([]);
    }
  });
});

describe("listCalendarEventsToolInputSchema", () => {
  test("accepts offset and local datetime strings", () => {
    const result = listCalendarEventsToolInputSchema.safeParse({
      start: "2026-06-16T00:00:00+05:30",
      end: "2026-06-16T23:59:59+05:30",
    });
    expect(result.success).toBe(true);
  });
});

describe("buildGmailSearchQuery", () => {
  test("combines sender, date, and attachment filters", () => {
    const q = buildGmailSearchQuery({
      query: "quarterly review",
      sender: "client@acme.com",
      after: "2026-01-15",
      before: "2026-02-01",
      hasAttachment: true,
    });
    expect(q).toContain("quarterly review");
    expect(q).toContain("from:client@acme.com");
    expect(q).toContain("after:2026/01/15");
    expect(q).toContain("before:2026/02/01");
    expect(q).toContain("has:attachment");
  });
});

describe("gmail webhook event filtering", () => {
  test("classifies messageReceived with threadId", () => {
    const { shouldClassifyGmailEvent } = require("@/lib/webhooks/gmail-event-filter");
    expect(
      shouldClassifyGmailEvent({
        type: "messageReceived",
        message: { threadId: "thread-abc" },
      })
    ).toBe(true);
  });

  test("ignores non-inbound events for classification", () => {
    const { shouldClassifyGmailEvent } = require("@/lib/webhooks/gmail-event-filter");
    expect(shouldClassifyGmailEvent({ type: "messageDeleted" })).toBe(false);
    expect(shouldClassifyGmailEvent({ type: "messageReceived", message: {} })).toBe(false);
  });
});
