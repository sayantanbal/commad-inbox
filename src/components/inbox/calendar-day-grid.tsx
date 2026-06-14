"use client";

import { addDays, differenceInMinutes, format, isSameDay, startOfDay } from "date-fns";
import { UserRound } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

const HOUR_HEIGHT = 44;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export type EventVisualType = "confirmed" | "tentative" | "focus" | "email-scheduled";

export function getEventVisualType(
  event: CalendarEvent,
  focusBlockEventIds?: Set<string>,
  threadMeetingEventIds?: Set<string>
): EventVisualType {
  if (focusBlockEventIds?.has(event.id)) return "focus";
  if (threadMeetingEventIds?.has(event.id)) return "email-scheduled";
  if (event.status === "tentative") return "tentative";
  return "confirmed";
}

export function isAllDayEvent(event: CalendarEvent): boolean {
  const durationMs = event.end.getTime() - event.start.getTime();
  if (durationMs < 23 * 60 * 60 * 1000) return false;

  const start = event.start;
  const end = event.end;
  const startsAtMidnight =
    start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0;
  const endsAtMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;

  return startsAtMidnight && (endsAtMidnight || durationMs >= 24 * 60 * 60 * 1000);
}

export function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  return event.start < dayEnd && event.end > dayStart;
}

export function getEventSpanDayKeys(event: CalendarEvent): string[] {
  if (isAllDayEvent(event)) {
    const keys: string[] = [];
    let cursor = startOfDay(event.start);
    const endExclusive = startOfDay(event.end);
    while (cursor < endExclusive) {
      keys.push(format(cursor, "yyyy-MM-dd"));
      cursor = addDays(cursor, 1);
    }
    return keys.length > 0 ? keys : [format(event.start, "yyyy-MM-dd")];
  }
  return [format(event.start, "yyyy-MM-dd")];
}

export function eventTypeClasses(type: EventVisualType, allDay = false) {
  const base = {
    confirmed: {
      bg: "bg-[color:var(--color-primary)]/12",
      border: "border-[color:var(--color-primary)]/35",
      text: "text-primary",
      dot: "bg-primary",
    },
    tentative: {
      bg: "bg-[color:var(--color-warning)]/12",
      border: "border-[color:var(--color-warning)]/35",
      text: "text-[color:var(--color-warning)]",
      dot: "bg-[color:var(--color-warning)]",
    },
    focus: {
      bg: "bg-purple-500/12",
      border: "border-purple-500/35",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    "email-scheduled": {
      bg: "bg-[color:var(--color-success)]/12",
      border: "border-[color:var(--color-success)]/35",
      text: "text-[color:var(--color-success)]",
      dot: "bg-[color:var(--color-success)]",
    },
  }[type];

  if (allDay) {
    return {
      ...base,
      bg: cn(base.bg, "border-dashed"),
    };
  }

  return base;
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  columnCount: number;
}

function layoutTimedEvents(events: CalendarEvent[], day: Date): PositionedEvent[] {
  const dayStart = startOfDay(day);
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  const positioned: PositionedEvent[] = sorted.map((event) => {
    const startMinutes = Math.max(0, differenceInMinutes(event.start, dayStart));
    const endMinutes = Math.min(24 * 60, differenceInMinutes(event.end, dayStart));
    const durationMinutes = Math.max(15, endMinutes - startMinutes);

    return {
      event,
      top: (startMinutes / 60) * HOUR_HEIGHT,
      height: (durationMinutes / 60) * HOUR_HEIGHT,
      column: 0,
      columnCount: 1,
    };
  });

  for (let i = 0; i < positioned.length; i++) {
    const current = positioned[i];
    const overlapping = positioned.filter((other, index) => {
      if (index === i) return false;
      const aTop = current.top;
      const aBottom = current.top + current.height;
      const bTop = other.top;
      const bBottom = other.top + other.height;
      return aTop < bBottom && bTop < aBottom;
    });

    const usedColumns = new Set<number>();
    for (const neighbor of overlapping) {
      usedColumns.add(neighbor.column);
    }

    let column = 0;
    while (usedColumns.has(column)) column += 1;
    current.column = column;
    current.columnCount = Math.max(current.columnCount, overlapping.length + 1, column + 1);
  }

  for (const item of positioned) {
    const overlapping = positioned.filter((other) => {
      if (other.event.id === item.event.id) return false;
      const aTop = item.top;
      const aBottom = item.top + item.height;
      const bTop = other.top;
      const bBottom = other.top + other.height;
      return aTop < bBottom && bTop < aBottom;
    });
    item.columnCount = Math.max(item.columnCount, ...overlapping.map((o) => o.column + 1), item.column + 1);
  }

  return positioned;
}

function preBriefAttendee(event: CalendarEvent): string | null {
  const attendee = event.attendees.find(
    (person) => person.email.toLowerCase() !== event.organizer.email.toLowerCase()
  );
  return attendee?.email ?? event.attendees[0]?.email ?? null;
}

interface CalendarDayGridProps {
  date: Date;
  events: CalendarEvent[];
  focusBlockEventIds?: Set<string>;
  threadMeetingEventIds?: Set<string>;
  highlightedEventId?: string | null;
  onEventClick?: (event: CalendarEvent) => void;
  onOpenPreBrief?: (attendeeEmail: string) => void;
}

export function CalendarDayGrid({
  date,
  events,
  focusBlockEventIds,
  threadMeetingEventIds,
  highlightedEventId,
  onEventClick,
  onOpenPreBrief,
}: CalendarDayGridProps) {
  const dayEvents = useMemo(
    () => events.filter((event) => eventOccursOnDay(event, date)),
    [events, date]
  );

  const allDayEvents = useMemo(() => dayEvents.filter(isAllDayEvent), [dayEvents]);
  const timedEvents = useMemo(
    () => dayEvents.filter((event) => !isAllDayEvent(event)),
    [dayEvents]
  );
  const positionedEvents = useMemo(
    () => layoutTimedEvents(timedEvents, date),
    [timedEvents, date]
  );

  const now = new Date();
  const showNowIndicator = isSameDay(date, now);
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-hairline px-3 py-2">
        <p className="type-caption-strong text-ink uppercase" style={{ letterSpacing: "0.06em" }}>
          {format(date, "EEEE, MMM d")}
        </p>
      </div>

      {allDayEvents.length > 0 && (
        <div className="shrink-0 border-b border-hairline bg-pearl/40 px-2 py-2">
          <p className="mb-1.5 type-fine text-ink-muted-48 uppercase" style={{ letterSpacing: "0.08em" }}>
            All day
          </p>
          <div className="flex flex-wrap gap-1">
            {allDayEvents.map((event) => {
              const type = getEventVisualType(event, focusBlockEventIds, threadMeetingEventIds);
              const styles = eventTypeClasses(type, true);
              const isHighlighted = highlightedEventId === event.id;
              const briefEmail = preBriefAttendee(event);

              return (
                <div key={event.id} className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEventClick?.(event)}
                    className={cn(
                      "min-w-0 rounded-[8px] border px-2 py-1 text-left transition-colors",
                      styles.bg,
                      styles.border,
                      isHighlighted && "ring-1 ring-primary/50"
                    )}
                  >
                    <p className={cn("truncate type-caption font-semibold", styles.text)}>{event.summary}</p>
                  </button>
                  {onOpenPreBrief && briefEmail && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 rounded-full"
                      aria-label="Open pre-brief"
                      onClick={() => onOpenPreBrief(briefEmail)}
                    >
                      <UserRound className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-auto">
        <div className="relative flex" style={{ minHeight: HOUR_HEIGHT * 24 }}>
          <div className="w-10 shrink-0 border-r border-hairline bg-canvas">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-divider-soft pr-1 text-right"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-1 type-fine text-ink-muted-48">
                  {hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`}
                </span>
              </div>
            ))}
          </div>

          <div className="relative min-w-0 flex-1 bg-canvas">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-divider-soft"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {showNowIndicator && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 border-t border-primary/70"
                style={{ top: nowTop }}
              >
                <span className="absolute -left-1 top-0 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
              </div>
            )}

            {positionedEvents.map(({ event, top, height, column, columnCount }) => {
              const type = getEventVisualType(event, focusBlockEventIds, threadMeetingEventIds);
              const styles = eventTypeClasses(type);
              const isHighlighted = highlightedEventId === event.id;
              const widthPct = 100 / columnCount;
              const leftPct = column * widthPct;
              const briefEmail = preBriefAttendee(event);

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick?.(event)}
                  className={cn(
                    "absolute z-10 overflow-hidden rounded-[8px] border px-1.5 py-1 text-left transition-colors hover:brightness-[0.98]",
                    styles.bg,
                    styles.border,
                    isHighlighted && "ring-1 ring-primary/50"
                  )}
                  style={{
                    top,
                    height: Math.max(height, 28),
                    left: `calc(${leftPct}% + 2px)`,
                    width: `calc(${widthPct}% - 4px)`,
                  }}
                >
                  <p className={cn("truncate type-caption font-semibold leading-tight", styles.text)}>
                    {event.summary}
                  </p>
                  <p className="type-fine text-ink-muted-48">
                    {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                  </p>
                  {onOpenPreBrief && briefEmail && height >= 52 && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="mt-0.5 inline-flex items-center gap-1 type-fine text-ink-muted-80 hover:text-ink"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onOpenPreBrief(briefEmail);
                      }}
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                          keyEvent.preventDefault();
                          keyEvent.stopPropagation();
                          onOpenPreBrief(briefEmail);
                        }
                      }}
                    >
                      <UserRound className="h-2.5 w-2.5" />
                      Pre-brief
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
