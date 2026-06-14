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
import type { WorkingDaysStructured } from "@/lib/preferences/sanitize-working-days";
import type { CalendarEvent } from "@/lib/types";

const SLOT_MINUTES = 30;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 17;
const MAX_SLOTS = 12;
const HORIZON_DAYS = 14;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export interface FreeSlotsOptions {
  workingDays?: WorkingDaysStructured | null;
  excludeEventId?: string;
}

function getDayConfig(
  date: Date,
  workingDays?: WorkingDaysStructured | null
): { enabled: boolean; startHour: number; startMinute: number; endHour: number; endMinute: number } {
  const key = DAY_KEYS[getDay(date)];
  const slot = workingDays?.days[key];

  if (slot) {
    const [startHour, startMinute] = slot.start.split(":").map(Number);
    const [endHour, endMinute] = slot.end.split(":").map(Number);
    return {
      enabled: slot.enabled,
      startHour,
      startMinute,
      endHour,
      endMinute,
    };
  }

  const weekday = getDay(date) >= 1 && getDay(date) <= 5;
  return {
    enabled: weekday,
    startHour: DAY_START_HOUR,
    startMinute: 0,
    endHour: DAY_END_HOUR,
    endMinute: 0,
  };
}

function isWorkingDay(date: Date, workingDays?: WorkingDaysStructured | null): boolean {
  return getDayConfig(date, workingDays).enabled;
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

export function findConflictingEvent(
  events: CalendarEvent[],
  start: Date,
  end: Date,
  excludeEventId?: string
): CalendarEvent | null {
  return (
    events.find(
      (event) => event.id !== excludeEventId && overlaps(start, end, event)
    ) ?? null
  );
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export function isSlotBusyForAttendees(
  attendeeBusy: BusyInterval[],
  start: Date,
  end: Date
): boolean {
  return attendeeBusy.some((window) => start < window.end && end > window.start);
}

export interface FreeBlock {
  start: Date;
  durationMinutes: number;
}

/** Longest contiguous free window on a working day, capped at maxMinutes. */
export function findLongestFreeBlockOnDay(
  events: CalendarEvent[],
  day: Date,
  anchor = new Date(),
  options?: { minMinutes?: number; maxMinutes?: number; workingDays?: WorkingDaysStructured | null }
): FreeBlock | null {
  const minMinutes = options?.minMinutes ?? 60;
  const maxMinutes = options?.maxMinutes ?? 90;
  const dayConfig = getDayConfig(day, options?.workingDays);
  if (!dayConfig.enabled) return null;

  const dayStart = setMinutes(
    setHours(startOfDay(day), dayConfig.startHour),
    dayConfig.startMinute
  );
  const dayEnd = setMinutes(setHours(startOfDay(day), dayConfig.endHour), dayConfig.endMinute);

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
  options?: FreeSlotsOptions
): Date[] {
  const excludeEventId = options?.excludeEventId;
  const workingDays = options?.workingDays;
  const slots: Date[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset <= HORIZON_DAYS && slots.length < MAX_SLOTS; dayOffset++) {
    const day = addDays(startOfDay(anchor), dayOffset);
    if (!isWorkingDay(day, workingDays)) continue;

    const dayConfig = getDayConfig(day, workingDays);
    const startMinutes = dayConfig.startHour * 60 + dayConfig.startMinute;
    const endMinutes = dayConfig.endHour * 60 + dayConfig.endMinute;

    for (let minuteOfDay = startMinutes; minuteOfDay < endMinutes; minuteOfDay += SLOT_MINUTES) {
      const hour = Math.floor(minuteOfDay / 60);
      const minute = minuteOfDay % 60;
      const start = setMinutes(setHours(day, hour), minute);
      const end = addMinutes(start, durationMinutes);
      const endMinuteOfDay = hour * 60 + minute + durationMinutes;

      if (start <= now) continue;
      if (endMinuteOfDay > endMinutes) continue;

      if (!isSlotBusy(events, start, end, excludeEventId)) {
        slots.push(start);
        if (slots.length >= MAX_SLOTS) return slots;
      }
    }
  }

  return slots;
}

export function findNearestFreeSlot(
  events: CalendarEvent[],
  durationMinutes: number,
  preferred: Date,
  options?: FreeSlotsOptions
): Date | null {
  const candidates = computeFreeSlots(events, durationMinutes, preferred, options);
  if (candidates.length === 0) return null;

  const target = preferred.getTime();
  return candidates.reduce((best, slot) =>
    Math.abs(slot.getTime() - target) < Math.abs(best.getTime() - target) ? slot : best
  );
}
