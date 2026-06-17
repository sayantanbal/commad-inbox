import "server-only";

import type { CorsairInstance } from "@/lib/corsair";
import { fetchEventsInRange } from "@/lib/corsair/events";
import { eventsToBusyWindows, type BusyWindow } from "@/lib/calendar/free-slots";

export type { BusyWindow };

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

  result[userLower] = eventsToBusyWindows(events, rangeStart, rangeEnd);
  return result;
}
