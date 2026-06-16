import { describe, expect, test } from "bun:test";
import {
  buildCalendarWebhookUrl,
  canRegisterCalendarWatch,
} from "@/lib/webhooks/calendar-watch-url";

describe("canRegisterCalendarWatch", () => {
  test("allows https URLs", () => {
    expect(canRegisterCalendarWatch("https://command-inbox.example.com")).toBe(true);
  });

  test("rejects http localhost", () => {
    expect(canRegisterCalendarWatch("http://localhost:3000")).toBe(false);
  });
});

describe("buildCalendarWebhookUrl", () => {
  test("builds tenant-scoped webhook path", () => {
    const url = buildCalendarWebhookUrl("https://app.example.com", "user-1");
    expect(url).toBe("https://app.example.com/api/webhooks/calendar?tenantId=user-1");
  });
});
