import type { SchedulingIntent } from "@/lib/types";

/** Use M-key inbox scheduling when invite guests overlap the open thread. */
export function shouldBridgeInviteToInbox(
  input: Record<string, unknown>,
  selectedThread: { participants: Array<{ email: string }> } | null
): boolean {
  if (!selectedThread) return false;
  const attendees = asStringArray(input.attendees);
  if (attendees.length === 0) return false;
  const threadEmails = new Set(
    selectedThread.participants.map((participant) => participant.email.toLowerCase())
  );
  return attendees.some((email) => threadEmails.has(email.toLowerCase()));
}

function asStringArray(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/** Build a scheduling intent from agent create_calendar_invite tool input. */
export function schedulingIntentFromAgentInvite(
  input: Record<string, unknown>
): SchedulingIntent | null {
  const startRaw = typeof input.start === "string" ? input.start : null;
  if (!startRaw) return null;

  const start = new Date(startRaw);
  if (Number.isNaN(start.getTime())) return null;

  const duration =
    typeof input.durationMinutes === "number" && input.durationMinutes > 0
      ? input.durationMinutes
      : 30;

  return {
    proposedTimes: [start],
    attendees: asStringArray(input.attendees),
    duration,
    confidence: 1,
  };
}
