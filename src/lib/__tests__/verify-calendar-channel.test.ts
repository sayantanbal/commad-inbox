import { describe, expect, test } from "bun:test";
import { validateCalendarWebhookChannel } from "@/lib/webhooks/calendar-channel-validation";

describe("validateCalendarWebhookChannel", () => {
  test("rejects when watch token is not configured", () => {
    const result = validateCalendarWebhookChannel(null, "token", null, "ch-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });

  test("rejects invalid channel token", () => {
    const result = validateCalendarWebhookChannel("expected", "wrong", null, null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.message).toContain("token");
    }
  });

  test("rejects mismatched channel id", () => {
    const result = validateCalendarWebhookChannel("tok", "tok", "ch-a", "ch-b");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("channel id");
  });

  test("accepts valid token and matching channel id", () => {
    const result = validateCalendarWebhookChannel("tok", "tok", "ch-a", "ch-a");
    expect(result.ok).toBe(true);
  });
});
