import { describe, expect, test } from "bun:test";

type FreeBusyResponse = {
  calendars?: Record<
    string,
    { busy?: Array<{ start: string; end: string }> }
  >;
};

function mapFreeBusyEmails(
  emails: string[],
  raw: FreeBusyResponse
): Record<string, Array<{ start: string; end: string }>> {
  const calendars = raw.calendars ?? {};
  const result: Record<string, Array<{ start: string; end: string }>> = {};
  for (const email of emails) {
    const lower = email.toLowerCase();
    const entry =
      calendars[email] ??
      calendars[lower] ??
      Object.entries(calendars).find(([key]) => key.toLowerCase() === lower)?.[1];
    result[lower] = (entry?.busy ?? []).map((window) => ({
      start: window.start,
      end: window.end,
    }));
  }
  return result;
}

describe("google freeBusy email mapping", () => {
  test("normalizes calendar keys to lowercase attendee emails", () => {
    const mapped = mapFreeBusyEmails(["Alice@Example.com"], {
      calendars: {
        "alice@example.com": {
          busy: [{ start: "2026-06-17T10:00:00Z", end: "2026-06-17T11:00:00Z" }],
        },
      },
    });
    expect(mapped["alice@example.com"]).toHaveLength(1);
    expect(mapped["alice@example.com"][0].start).toBe("2026-06-17T10:00:00Z");
  });

  test("returns empty arrays when attendee has no busy blocks", () => {
    const mapped = mapFreeBusyEmails(["free@example.com"], { calendars: {} });
    expect(mapped["free@example.com"]).toEqual([]);
  });
});
