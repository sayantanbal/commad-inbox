import "server-only";

import type { CorsairInstance } from "@/lib/corsair";
import { getCalendarAccessToken, googleProxyFetch } from "@/lib/corsair/google-proxy";
import type { BusyWindow } from "@/lib/calendar/corsair-events-busy";

type FreeBusyResponse = {
  calendars?: Record<
    string,
    {
      busy?: Array<{ start: string; end: string }>;
      errors?: Array<{ domain?: string; reason?: string }>;
    }
  >;
};

/** Query Google Calendar freeBusy for all requested attendee emails (OD-6). */
export async function fetchAttendeeFreeBusy(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  emails: string[],
  timeMin: string,
  timeMax: string
): Promise<Record<string, BusyWindow[]>> {
  const uniqueEmails = [...new Set(emails.map((email) => email.trim()).filter(Boolean))];
  const result: Record<string, BusyWindow[]> = {};
  for (const email of uniqueEmails) {
    result[email.toLowerCase()] = [];
  }
  if (uniqueEmails.length === 0) return result;

  const accessToken = await getCalendarAccessToken(tenant);
  const raw = await googleProxyFetch<FreeBusyResponse>({
    accessToken,
    url: "https://www.googleapis.com/calendar/v3/freeBusy",
    method: "POST",
    body: {
      timeMin,
      timeMax,
      items: uniqueEmails.map((id) => ({ id })),
    },
  });

  const calendars = raw.calendars ?? {};
  for (const email of uniqueEmails) {
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
