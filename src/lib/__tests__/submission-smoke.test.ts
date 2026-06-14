import { describe, expect, test } from "bun:test";
import {
  createCalendarInviteToolInputSchema,
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
    }
  });

  test("rejects missing attendees", () => {
    const result = createCalendarInviteToolInputSchema.safeParse({
      summary: "Sync",
      start: "2026-06-19T09:00:00.000Z",
      attendees: [],
    });
    expect(result.success).toBe(false);
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
  function shouldClassifyWebhook(body: unknown): boolean {
    const event = body as { type?: string; message?: { threadId?: string } };
    return event.type === "messageReceived" && Boolean(event.message?.threadId);
  }

  test("classifies messageReceived with threadId", () => {
    expect(
      shouldClassifyWebhook({
        type: "messageReceived",
        message: { threadId: "thread-abc" },
      })
    ).toBe(true);
  });

  test("ignores non-inbound events", () => {
    expect(shouldClassifyWebhook({ type: "messageDeleted" })).toBe(false);
    expect(shouldClassifyWebhook({ type: "messageReceived", message: {} })).toBe(false);
  });
});
