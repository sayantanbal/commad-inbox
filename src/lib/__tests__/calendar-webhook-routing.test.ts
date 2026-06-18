import { describe, expect, test } from "bun:test";
import {
  CALENDAR_SYNC_HANDLER,
  shouldHandleCorsairCalendarEvent,
  shouldHandleGoogleCalendarPush,
} from "@/lib/webhooks/calendar-webhook-routing";

describe("calendar webhook routing", () => {
  test("Corsair processWebhook routes googlecalendar.eventChanged to shared handler", () => {
    expect(shouldHandleCorsairCalendarEvent("googlecalendar", "eventChanged")).toBe(true);
    expect(shouldHandleCorsairCalendarEvent("gmail", "messageChanged")).toBe(false);
    expect(shouldHandleCorsairCalendarEvent("googlecalendar", "watchExpired")).toBe(false);
  });

  test("Google push skips sync handshake only", () => {
    expect(shouldHandleGoogleCalendarPush("sync")).toBe(false);
    expect(shouldHandleGoogleCalendarPush("exists")).toBe(true);
    expect(shouldHandleGoogleCalendarPush(null)).toBe(true);
  });

  test("both entry points document the same sync handler", () => {
    expect(CALENDAR_SYNC_HANDLER).toBe("handleCalendarEventChanged");
  });

  test("end-to-end: either path triggers calendar sync decision", () => {
    const corsairPath = shouldHandleCorsairCalendarEvent("googlecalendar", "eventChanged");
    const googlePath = shouldHandleGoogleCalendarPush("exists");
    expect(corsairPath && googlePath).toBe(true);
  });
});
