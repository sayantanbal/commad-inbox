import {
  addDays,
  addMinutes,
  differenceInMinutes,
  getDay,
  isSameDay,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import type { CalendarEvent } from "@/lib/types";

const SLOT_MINUTES = 30;
/** Weekday work hours in the user's local timezone (client) or server TZ (API). */
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 17;
const MAX_SLOTS = 12;
const HORIZON_DAYS = 14;

function isWeekday(date: Date): boolean {
  const day = getDay(date);
  return day >= 1 && day <= 5;
}

export function overlaps(start: Date, end: Date, event: CalendarEvent): boolean {
  return start < event.end && end > event.start;
}

export function isSlotBusy(
  events: CalendarEvent[],
  start: Date,
  end: Date,
  excludeEventId?: string
): boolean {
  return events.some(
    (event) => event.id !== excludeEventId && overlaps(start, end, event)
  );
}

export interface FreeBlock {
  start: Date;
  durationMinutes: number;
}

/** Longest contiguous free window on a weekday (9–5), capped at maxMinutes. */
export function findLongestFreeBlockOnDay(
  events: CalendarEvent[],
  day: Date,
  anchor = new Date(),
  options?: { minMinutes?: number; maxMinutes?: number }
): FreeBlock | null {
  const minMinutes = options?.minMinutes ?? 60;
  const maxMinutes = options?.maxMinutes ?? 90;

  const dayStart = setMinutes(setHours(startOfDay(day), DAY_START_HOUR), 0);
  const dayEnd = setMinutes(setHours(startOfDay(day), DAY_END_HOUR), 0);

  const dayEvents = events
    .filter((event) => isSameDay(event.start, day))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const windows: Array<{ start: Date; end: Date }> = [];
  let cursor = dayStart;

  for (const event of dayEvents) {
    const busyStart = event.start < dayStart ? dayStart : event.start;
    const busyEnd = event.end > dayEnd ? dayEnd : event.end;
    if (busyStart > cursor) {
      windows.push({ start: cursor, end: busyStart });
    }
    if (busyEnd > cursor) {
      cursor = busyEnd;
    }
  }

  if (cursor < dayEnd) {
    windows.push({ start: cursor, end: dayEnd });
  }

  let best: FreeBlock | null = null;

  for (const window of windows) {
    const effectiveStart = window.start < anchor ? anchor : window.start;
    if (effectiveStart >= window.end) continue;

    const available = differenceInMinutes(window.end, effectiveStart);
    if (available < minMinutes) continue;

    const durationMinutes = Math.min(available, maxMinutes);
    if (!best || durationMinutes > best.durationMinutes) {
      best = { start: effectiveStart, durationMinutes };
    }
  }

  return best;
}

export function computeFreeSlots(
  events: CalendarEvent[],
  durationMinutes: number,
  anchor = new Date(),
  excludeEventId?: string
): Date[] {
  const slots: Date[] = [];
  const now = new Date();
  let day = startOfDay(anchor);

  for (let dayOffset = 0; dayOffset <= HORIZON_DAYS && slots.length < MAX_SLOTS; dayOffset++) {
    day = addDays(startOfDay(anchor), dayOffset);
    if (!isWeekday(day)) continue;

    for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
      for (const minute of [0, SLOT_MINUTES]) {
        if (hour === DAY_END_HOUR - 1 && minute > 0) continue;

        const start = setMinutes(setHours(day, hour), minute);
        const end = addMinutes(start, durationMinutes);

        if (start <= now) continue;

        if (end.getHours() > DAY_END_HOUR || (end.getHours() === DAY_END_HOUR && end.getMinutes() > 0)) {
          continue;
        }

        if (!isSlotBusy(events, start, end, excludeEventId)) {
          slots.push(start);
          if (slots.length >= MAX_SLOTS) return slots;
        }
      }
    }
  }

  return slots;
}

export function findNearestFreeSlot(
  events: CalendarEvent[],
  durationMinutes: number,
  preferred: Date,
  excludeEventId?: string
): Date | null {
  const candidates = computeFreeSlots(events, durationMinutes, preferred, excludeEventId);
  if (candidates.length === 0) return null;

  const target = preferred.getTime();
  return candidates.reduce((best, slot) =>
    Math.abs(slot.getTime() - target) < Math.abs(best.getTime() - target) ? slot : best
  );
}
