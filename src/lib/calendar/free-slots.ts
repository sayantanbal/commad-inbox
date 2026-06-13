import { addDays, addMinutes, getDay, setHours, setMinutes, startOfDay } from "date-fns";
import type { CalendarEvent } from "@/lib/types";

const SLOT_MINUTES = 30;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 17;
const MAX_SLOTS = 12;

function isWeekday(date: Date): boolean {
  const day = getDay(date);
  return day >= 1 && day <= 5;
}

function overlaps(start: Date, end: Date, event: CalendarEvent): boolean {
  return start < event.end && end > event.start;
}

export function computeFreeSlots(
  events: CalendarEvent[],
  durationMinutes: number,
  anchor = new Date()
): Date[] {
  const slots: Date[] = [];
  let day = startOfDay(anchor);

  while (slots.length < MAX_SLOTS) {
    day = addDays(day, 1);
    if (!isWeekday(day)) continue;

    for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
      for (const minute of [0, SLOT_MINUTES]) {
        if (hour === DAY_END_HOUR - 1 && minute > 0) continue;

        const start = setMinutes(setHours(day, hour), minute);
        const end = addMinutes(start, durationMinutes);

        if (end.getHours() > DAY_END_HOUR || (end.getHours() === DAY_END_HOUR && end.getMinutes() > 0)) {
          continue;
        }

        const busy = events.some((event) => overlaps(start, end, event));
        if (!busy) {
          slots.push(start);
          if (slots.length >= MAX_SLOTS) return slots;
        }
      }
    }

    if (addDays(day, 0).getTime() - anchor.getTime() > 14 * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return slots;
}
