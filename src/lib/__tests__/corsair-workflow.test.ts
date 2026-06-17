import { describe, expect, test } from "bun:test";
import {
  eventsToBusyWindows,
  isSlotBusy,
  isSlotBusyForAttendees,
  overlaps,
} from "@/lib/calendar/free-slots";
import type { CalendarEvent } from "@/lib/types";
import {
  createCalendarInviteToolOutputSchema,
  listCalendarEventsToolOutputSchema,
  sendEmailToolOutputSchema,
} from "@/lib/schemas/agent-tools";
import { AGENT_TOOL_ANNOTATIONS } from "@/lib/agent/tool-annotations";

describe("eventsToBusyWindows", () => {
  test("includes overlapping events only", () => {
    const rangeStart = new Date("2026-06-17T09:00:00Z");
    const rangeEnd = new Date("2026-06-17T18:00:00Z");
    const windows = eventsToBusyWindows(
      [
        {
          start: new Date("2026-06-17T10:00:00Z"),
          end: new Date("2026-06-17T11:00:00Z"),
        },
        {
          start: new Date("2026-06-18T10:00:00Z"),
          end: new Date("2026-06-18T11:00:00Z"),
        },
      ],
      rangeStart,
      rangeEnd
    );
    expect(windows).toHaveLength(1);
    expect(windows[0].start).toBe("2026-06-17T10:00:00.000Z");
  });

  test("returns empty when no events overlap range", () => {
    const windows = eventsToBusyWindows(
      [{ start: new Date("2026-06-20T10:00:00Z"), end: new Date("2026-06-20T11:00:00Z") }],
      new Date("2026-06-17T09:00:00Z"),
      new Date("2026-06-17T18:00:00Z")
    );
    expect(windows).toEqual([]);
  });
});

describe("attendee busy slot checks", () => {
  const event: CalendarEvent = {
    id: "e1",
    summary: "Sync",
    start: new Date("2026-06-17T10:00:00Z"),
    end: new Date("2026-06-17T11:00:00Z"),
  };

  test("overlaps detects intersection", () => {
    expect(
      overlaps(
        new Date("2026-06-17T10:30:00Z"),
        new Date("2026-06-17T11:30:00Z"),
        event
      )
    ).toBe(true);
  });

  test("isSlotBusy respects excludeEventId", () => {
    expect(
      isSlotBusy(
        [event],
        new Date("2026-06-17T10:15:00Z"),
        new Date("2026-06-17T10:45:00Z"),
        "e1"
      )
    ).toBe(false);
  });

  test("isSlotBusyForAttendees detects attendee conflict", () => {
    expect(
      isSlotBusyForAttendees(
        [{ start: new Date("2026-06-17T10:00:00Z"), end: new Date("2026-06-17T11:00:00Z") }],
        new Date("2026-06-17T10:30:00Z"),
        new Date("2026-06-17T11:00:00Z")
      )
    ).toBe(true);
  });
});

describe("agent tool output schemas", () => {
  test("sendEmailToolOutputSchema accepts valid payload", () => {
    const parsed = sendEmailToolOutputSchema.safeParse({
      messageId: "msg-1",
      recipients: ["a@example.com"],
      attachmentCount: 0,
      summary: "Sent",
    });
    expect(parsed.success).toBe(true);
  });

  test("createCalendarInviteToolOutputSchema accepts meet link", () => {
    const parsed = createCalendarInviteToolOutputSchema.safeParse({
      eventId: "evt-1",
      summary: "Standup",
      start: "2026-06-17T10:00:00.000Z",
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      summaryText: "Invite sent",
    });
    expect(parsed.success).toBe(true);
  });

  test("listCalendarEventsToolOutputSchema accepts empty list", () => {
    const parsed = listCalendarEventsToolOutputSchema.safeParse({
      count: 0,
      events: [],
    });
    expect(parsed.success).toBe(true);
  });
});

describe("AGENT_TOOL_ANNOTATIONS", () => {
  test("marks destructive write tools", () => {
    expect(AGENT_TOOL_ANNOTATIONS.send_email?.destructiveHint).toBe(true);
    expect(AGENT_TOOL_ANNOTATIONS.cancel_meeting_with_notice?.destructiveHint).toBe(true);
  });

  test("marks read-only discovery tools", () => {
    expect(AGENT_TOOL_ANNOTATIONS.search_threads?.readOnlyHint).toBe(true);
    expect(AGENT_TOOL_ANNOTATIONS.list_operations?.readOnlyHint).toBe(true);
  });
});
