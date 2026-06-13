import type { CalendarEvent, Participant } from "@/lib/types";

export type RsvpSummary =
  | { kind: "none" }
  | { kind: "pending"; label: string }
  | { kind: "accepted"; label: string }
  | { kind: "mixed"; label: string }
  | { kind: "declined"; label: string };

function externalAttendees(attendees: Participant[], userEmail: string): Participant[] {
  return attendees.filter(
    (attendee) => attendee.email.toLowerCase() !== userEmail.toLowerCase() && !attendee.email.includes("unknown")
  );
}

export function summarizeRsvp(event: CalendarEvent | null, userEmail: string): RsvpSummary {
  if (!event) return { kind: "none" };

  const guests = externalAttendees(event.attendees, userEmail);
  if (guests.length === 0) return { kind: "none" };

  const accepted = guests.filter((guest) => guest.responseStatus === "accepted").length;
  const declined = guests.filter((guest) => guest.responseStatus === "declined").length;
  const tentative = guests.filter((guest) => guest.responseStatus === "tentative").length;
  const pending = guests.filter(
    (guest) => !guest.responseStatus || guest.responseStatus === "needsAction"
  ).length;

  if (declined === guests.length) {
    return { kind: "declined", label: "All declined" };
  }

  if (accepted === guests.length) {
    return { kind: "accepted", label: "All accepted" };
  }

  if (pending === guests.length) {
    return { kind: "pending", label: "Awaiting RSVP" };
  }

  const parts: string[] = [];
  if (accepted > 0) parts.push(`${accepted} yes`);
  if (tentative > 0) parts.push(`${tentative} maybe`);
  if (pending > 0) parts.push(`${pending} pending`);
  if (declined > 0) parts.push(`${declined} no`);

  return { kind: "mixed", label: parts.join(" · ") };
}
