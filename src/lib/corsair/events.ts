import { endOfMonth, startOfMonth } from "date-fns";
import { AuthMissingError } from "corsair/core";
import type { CorsairInstance } from "@/lib/corsair";
import type { CalendarEvent, Participant } from "@/lib/types";

function isAuthError(error: unknown): boolean {
  if (error instanceof AuthMissingError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("auth-missing") ||
    message.includes("Authentication required") ||
    message.includes("Account not found")
  );
}

function toParticipant(input?: {
  email?: string;
  displayName?: string;
}): Participant {
  const email = input?.email ?? "unknown@unknown";
  return {
    email,
    name: input?.displayName?.trim() || email,
  };
}

function parseEventDate(value?: { dateTime?: string; date?: string }): Date | null {
  const raw = value?.dateTime ?? value?.date;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function fetchEventsForTenant(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  anchor = new Date()
): Promise<CalendarEvent[]> {
  try {
    const timeMin = startOfMonth(anchor).toISOString();
    const timeMax = endOfMonth(anchor).toISOString();

    const response = await tenant.googlecalendar.api.events.getMany({
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    const events: CalendarEvent[] = [];

    for (const item of response.items ?? []) {
      const start = parseEventDate(item.start);
      const end = parseEventDate(item.end);
      if (!item.id || !start || !end) continue;

      events.push({
        id: item.id,
        summary: item.summary ?? "(No title)",
        start,
        end,
        attendees: (item.attendees ?? []).map((attendee) => toParticipant(attendee)),
        location: item.location,
        description: item.description,
        organizer: toParticipant(item.organizer ?? item.creator),
        status: item.status ?? "confirmed",
      });
    }

    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  } catch (error) {
    if (isAuthError(error)) {
      throw error;
    }
    throw error;
  }
}
