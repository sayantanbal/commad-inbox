import { describe, expect, test } from "bun:test";
import { buildCalendarWebhookUrl, canRegisterCalendarWatch } from "@/lib/webhooks/calendar-watch-url";

describe("google-proxy gateway (watch URLs)", () => {
  test("calendar watch URL requires https", () => {
    expect(canRegisterCalendarWatch("https://app.example.com")).toBe(true);
    expect(canRegisterCalendarWatch("http://localhost:3000")).toBe(false);
  });

  test("builds webhook path for tenant", () => {
    expect(buildCalendarWebhookUrl("https://app.example.com", "u1")).toContain("tenantId=u1");
  });
});
