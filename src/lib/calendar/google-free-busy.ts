import "server-only";

import type { CorsairInstance } from "@/lib/corsair";

export interface BusyWindow {
  start: string;
  end: string;
}

export async function fetchGoogleFreeBusy(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  emails: string[],
  timeMin: string,
  timeMax: string
): Promise<Record<string, BusyWindow[]>> {
  const token = await tenant.googlecalendar.keys.get_access_token();
  if (!token) {
    throw new Error("Calendar access token unavailable");
  }

  const uniqueEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (uniqueEmails.length === 0) {
    return {};
  }

  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: uniqueEmails.map((id) => ({ id })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google freeBusy failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    calendars?: Record<string, { busy?: BusyWindow[] }>;
  };

  const busy: Record<string, BusyWindow[]> = {};
  for (const email of uniqueEmails) {
    busy[email] = payload.calendars?.[email]?.busy ?? [];
  }
  return busy;
}
