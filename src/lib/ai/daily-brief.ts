import "server-only";

import { format } from "date-fns";
import { generateJsonWithProvider, streamJsonWithProvider } from "@/lib/ai/generate";
import type { AiProvider } from "@/lib/ai/providers";
import { dailyBriefSchema } from "@/lib/schemas/domain";
import type { CalendarEvent, Classification, Thread } from "@/lib/types";

const DAILY_BRIEF_SYSTEM = `You write a warm, concise daily brief for a scheduling-centric inbox (Gmail + Calendar).
Use timeline-style items with short labels (e.g. "First", "9:30 AM", "Heads up", "Quiet").
Prioritize: urgent replies, today's meetings, scheduling requests, invoices/deadlines, open calendar gaps, cold contacts going quiet (21+ days), open commitments due soon.
Each item is one sentence. Add 0-2 action chips on items where the user can act now.
Action types: reply, archive, schedule, snooze, compose, open_thread — include threadId when relevant.
Keep total items between 3 and 6. Tone: calm, professional, human — like a chief of staff.`;

function formatEventsForBrief(events: CalendarEvent[]): string {
  if (events.length === 0) return "No calendar events today.";
  return events
    .slice(0, 12)
    .map(
      (e) =>
        `- ${format(e.start, "h:mm a")}–${format(e.end, "h:mm a")}: ${e.summary} (${e.attendees.map((a) => a.email).join(", ") || "no attendees"})`
    )
    .join("\n");
}

function formatInboxForBrief(threads: Thread[], classifications: Classification[]): string {
  const byId = new Map(classifications.map((c) => [c.threadId, c]));
  const lines = threads.slice(0, 15).map((t) => {
    const c = byId.get(t.id);
    return `- [${c?.lane ?? "?"}|${c?.priority ?? "?"}] id=${t.id} ${t.subject} — ${c?.sender ?? t.participants[0]?.email} — ${t.snippet}`;
  });
  return lines.join("\n") || "Inbox empty.";
}

function buildDailyBriefPrompt(params: {
  userName: string;
  userEmail: string;
  threads: Thread[];
  classifications: Classification[];
  events: CalendarEvent[];
  timezone: string;
}) {
  const now = new Date();
  return [
    `User: ${params.userName || params.userEmail}`,
    `Email: ${params.userEmail}`,
    `Timezone: ${params.timezone}`,
    `Now: ${now.toISOString()}`,
    `Today is ${format(now, "EEEE, MMMM d")}.`,
    "",
    "## Calendar today",
    formatEventsForBrief(
      params.events.filter((e) => format(e.start, "yyyy-MM-dd") === format(now, "yyyy-MM-dd"))
    ),
    "",
    "## Inbox highlights",
    formatInboxForBrief(params.threads, params.classifications),
  ].join("\n");
}

export async function generateDailyBrief(
  userId: string,
  params: {
    userName: string;
    userEmail: string;
    threads: Thread[];
    classifications: Classification[];
    events: CalendarEvent[];
    timezone: string;
  },
  provider: AiProvider
) {
  const prompt = buildDailyBriefPrompt(params);

  const { data, provider: used } = await generateJsonWithProvider(
    userId,
    provider,
    prompt,
    DAILY_BRIEF_SYSTEM,
    dailyBriefSchema
  );

  return { brief: data, provider: used };
}

export async function streamDailyBrief(
  userId: string,
  params: {
    userName: string;
    userEmail: string;
    threads: Thread[];
    classifications: Classification[];
    events: CalendarEvent[];
    timezone: string;
  },
  provider: AiProvider,
  onPartial: (partial: Partial<import("@/lib/schemas/domain").DailyBrief>) => void
) {
  const prompt = buildDailyBriefPrompt(params);

  const { data, provider: used } = await streamJsonWithProvider(
    userId,
    provider,
    prompt,
    DAILY_BRIEF_SYSTEM,
    dailyBriefSchema,
    onPartial
  );

  return { brief: data, provider: used };
}
