import type { SchedulingIntent, Thread } from "@/lib/types";

export function replyRecipients(thread: Thread, userEmail: string): string[] {
  const latest = thread.messages.at(-1);
  if (!latest) {
    return thread.participants
      .map((participant) => participant.email)
      .filter((email) => email.toLowerCase() !== userEmail.toLowerCase());
  }

  const recipients = new Set<string>();
  if (latest.from.email.toLowerCase() !== userEmail.toLowerCase()) {
    recipients.add(latest.from.email);
  }
  for (const participant of latest.to) {
    if (participant.email.toLowerCase() !== userEmail.toLowerCase()) {
      recipients.add(participant.email);
    }
  }

  return [...recipients];
}

export function resolveMeetingAttendees(
  thread: Thread,
  schedulingIntent: SchedulingIntent | null,
  userEmail: string
): string[] {
  const excludeSelf = (emails: string[]) =>
    emails.filter((email) => email.toLowerCase() !== userEmail.toLowerCase());

  if (schedulingIntent?.attendees?.length) {
    return excludeSelf(schedulingIntent.attendees);
  }

  return excludeSelf(thread.participants.map((participant) => participant.email));
}
