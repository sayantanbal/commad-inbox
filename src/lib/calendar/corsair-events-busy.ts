import "server-only";

import type { CorsairInstance } from "@/lib/corsair";
import { fetchEventsInRange } from "@/lib/corsair/events";

export interface BusyWindow {
  start: string;
  end: string;
}

/**
 * Derive busy windows from Corsair Calendar events (primary calendar).
 * External attendee calendars are not queried — overlap for scheduling uses the user's own events.
 */
export async function fetchBusyFromCorsairEvents(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  emails: string[],
  timeMin: string,
  timeMax: string,
  userEmail: string
): Promise<Record<string, BusyWindow[]>> {
  const uniqueEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const result: Record<string, BusyWindow[]> = {};

  for (const email of uniqueEmails) {
    result[email] = [];
  }

  const rangeStart = new Date(timeMin);
  const rangeEnd = new Date(timeMax);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return result;
  }

  const events = await fetchEventsInRange(tenant, rangeStart, rangeEnd);
  const userLower = userEmail.trim().toLowerCase();
  const userRequested = uniqueEmails.includes(userLower);

  if (!userRequested) {
    return result;
  }

  const busy: BusyWindow[] = [];
  for (const event of events) {
    if (event.end <= rangeStart || event.start >= rangeEnd) {
      continue;
    }
    busy.push({
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    });
  }

  result[userLower] = busy;
  return result;
}
