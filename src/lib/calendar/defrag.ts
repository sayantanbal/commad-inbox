import { addDays, differenceInMinutes, format, isSameDay, startOfWeek } from "date-fns";
import { findLongestFreeBlockOnDay } from "@/lib/calendar/free-slots";
import type { CalendarEvent } from "@/lib/types";

export interface DefragInsight {
  id: string;
  kind: "back_to_back" | "fragmented" | "focus_slot";
  label: string;
  detail: string;
  day?: Date;
  durationMinutes?: number;
}

export function analyzeWeekDefrag(events: CalendarEvent[], anchor = new Date()): DefragInsight[] {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const insights: DefragInsight[] = [];
  const fragmentedDayKeys = new Set<string>();

  for (const day of weekDays) {
    const dayKey = format(day, "yyyy-MM-dd");
    const dayEvents = events
      .filter((event) => isSameDay(event.start, day))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < dayEvents.length - 1; i++) {
      const current = dayEvents[i];
      const next = dayEvents[i + 1];
      const gap = differenceInMinutes(next.start, current.end);
      if (gap >= 0 && gap < 15) {
        insights.push({
          id: `b2b-${current.id}-${next.id}`,
          kind: "back_to_back",
          label: format(day, "EEE"),
          detail: `"${current.summary}" → "${next.summary}" with only ${gap}m between them.`,
          day,
        });
      }
    }

    const meetingMinutes = dayEvents.reduce(
      (sum, event) => sum + differenceInMinutes(event.end, event.start),
      0
    );
    if (dayEvents.length >= 4 && meetingMinutes >= 180) {
      fragmentedDayKeys.add(dayKey);
      const best = findLongestFreeBlockOnDay(events, day, anchor);

      if (best) {
        insights.push({
          id: `frag-${dayKey}`,
          kind: "fragmented",
          label: format(day, "EEE"),
          detail: `${dayEvents.length} meetings (${Math.round(meetingMinutes / 60)}h). Best open slot: ${format(best.start, "h:mm a")} (${best.durationMinutes}m).`,
          day: best.start,
          durationMinutes: best.durationMinutes,
        });
      } else {
        insights.push({
          id: `frag-${dayKey}`,
          kind: "fragmented",
          label: format(day, "EEE"),
          detail: `${dayEvents.length} meetings (${Math.round(meetingMinutes / 60)}h) — no 60m+ gap left to block focus time.`,
          day,
        });
      }
    }
  }

  const focusCandidates = weekDays.flatMap((day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    if (fragmentedDayKeys.has(dayKey)) return [];

    const dayEvents = events
      .filter((event) => isSameDay(event.start, day))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const focusStart = new Date(day);
    focusStart.setHours(14, 0, 0, 0);
    const focusEnd = new Date(day);
    focusEnd.setHours(15, 30, 0, 0);

    const blocked = dayEvents.some(
      (event) => event.start < focusEnd && event.end > focusStart
    );
    if (!blocked && focusStart > anchor) {
      return [
        {
          id: `focus-${dayKey}`,
          kind: "focus_slot" as const,
          label: format(day, "EEE 2:00 PM"),
          detail: "Open 90-minute block — good for deep work.",
          day: focusStart,
          durationMinutes: 90,
        },
      ];
    }
    return [];
  });

  return [...insights.slice(0, 6), ...focusCandidates.slice(0, 3)];
}
