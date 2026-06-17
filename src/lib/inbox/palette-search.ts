import type { Thread } from "@/lib/types";

function threadSender(thread: Thread): string {
  const participant = thread.participants[0];
  return participant?.email ?? participant?.name ?? "";
}

export function threadDisplaySender(thread: Pick<Thread, "participants">): string {
  const participant = thread.participants[0];
  return participant?.name ?? participant?.email ?? "Unknown";
}

export interface PaletteNavCommand {
  id: string;
  label: string;
  keywords: string;
  action: string;
  group: "Navigate" | "Actions";
}

export const PALETTE_NAV_COMMANDS: PaletteNavCommand[] = [
  { id: "nav-inbox", label: "Go to Inbox", keywords: "inbox mail home g i", action: "navInbox", group: "Navigate" },
  { id: "nav-sent", label: "Go to Sent", keywords: "sent outbound mail", action: "navSent", group: "Navigate" },
  { id: "nav-snoozed", label: "Go to Snoozed", keywords: "snooze later g s", action: "navSnoozed", group: "Navigate" },
  { id: "nav-archive", label: "Go to Archive", keywords: "archive done trash", action: "navArchive", group: "Navigate" },
  { id: "nav-brief", label: "Go to Daily Brief", keywords: "brief summary morning g b", action: "navBrief", group: "Navigate" },
  { id: "nav-calendar", label: "Go to Calendar", keywords: "calendar schedule events g c", action: "navCalendar", group: "Navigate" },
  { id: "nav-commitments", label: "Go to Commitments", keywords: "commitments promises tasks g t", action: "navCommitments", group: "Navigate" },
  { id: "nav-waiting", label: "Go to Waiting For", keywords: "waiting follow up blocked", action: "navWaiting", group: "Navigate" },
  { id: "nav-people", label: "Go to People", keywords: "people contacts network relationships", action: "navPeople", group: "Navigate" },
  { id: "nav-settings", label: "Open Settings", keywords: "settings preferences config", action: "navSettings", group: "Navigate" },
  { id: "verb-archive", label: "Archive selected thread", keywords: "archive done e trash", action: "archive", group: "Actions" },
  { id: "verb-snooze", label: "Snooze selected thread", keywords: "snooze later s delay", action: "snooze", group: "Actions" },
  { id: "verb-schedule", label: "Schedule meeting", keywords: "schedule meeting m calendar invite", action: "meeting", group: "Actions" },
];

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function scoreMatch(query: string, haystack: string): number {
  const q = normalize(query);
  const h = normalize(haystack);
  if (!q) return 1;
  if (h.includes(q)) return 100 - h.indexOf(q);
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const token of tokens) {
    if (h.includes(token)) score += 10;
    else return 0;
  }
  return score;
}

export function filterPaletteNavCommands(query: string): PaletteNavCommand[] {
  if (!query.trim()) return PALETTE_NAV_COMMANDS;
  return PALETTE_NAV_COMMANDS.filter(
    (command) => scoreMatch(query, `${command.label} ${command.keywords}`) > 0
  );
}

export function searchThreadsForPalette(threads: Thread[], query: string, limit = 8): Thread[] {
  const q = normalize(query);
  if (!q) return [];

  return threads
    .map((thread) => ({
      thread,
      score: Math.max(
        scoreMatch(q, thread.subject),
        scoreMatch(q, threadSender(thread)),
        scoreMatch(q, thread.snippet ?? "")
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.thread);
}
