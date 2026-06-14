"use client";

import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDayGrid,
  eventOccursOnDay,
  eventTypeClasses,
  getEventSpanDayKeys,
  getEventVisualType,
} from "@/components/inbox/calendar-day-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCalendarDays } from "@/lib/calendar-days";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarPanelProps {
  events: CalendarEvent[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onDefrag?: () => void;
  onMonthChange?: (month: Date) => void;
  threadMeetingEventIds?: Set<string>;
  focusBlockEventIds?: Set<string>;
  onEventClick?: (event: CalendarEvent) => void;
  onOpenPreBrief?: (attendeeEmail: string) => void;
}

export function CalendarPanel({
  events,
  searchQuery = "",
  onSearchChange,
  onDefrag,
  onMonthChange,
  threadMeetingEventIds,
  focusBlockEventIds,
  onEventClick,
  onOpenPreBrief,
}: CalendarPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const today = new Date();

  useEffect(() => {
    onMonthChange?.(currentMonth);
  }, [currentMonth, onMonthChange]);

  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (event) =>
        event.summary.toLowerCase().includes(q) ||
        event.attendees.some(
          (attendee) =>
            attendee.name.toLowerCase().includes(q) || attendee.email.toLowerCase().includes(q)
        )
    );
  }, [events, searchQuery]);

  const monthEvents = useMemo(
    () =>
      filteredEvents
        .filter((event) => isSameMonth(event.start, currentMonth))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [filteredEvents, currentMonth]
  );

  const highlightedDayKeys = useMemo(() => {
    if (!highlightedEventId) return new Set<string>();
    const event = filteredEvents.find((item) => item.id === highlightedEventId);
    if (!event) return new Set<string>();
    return new Set(getEventSpanDayKeys(event));
  }, [filteredEvents, highlightedEventId]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      getEventSpanDayKeys(event).forEach((key) => {
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
      });
    });
    return map;
  }, [filteredEvents]);

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(startOfMonth(now));
    setSelectedDay(now);
    setHighlightedEventId(null);
  };

  const selectDay = (date: Date) => {
    setSelectedDay(date);
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(startOfMonth(date));
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setHighlightedEventId(event.id);
    setSelectedDay(event.start);
    if (!isSameMonth(event.start, currentMonth)) {
      setCurrentMonth(startOfMonth(event.start));
    }
    onEventClick?.(event);
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return filteredEvents
      .filter((event) => eventOccursOnDay(event, selectedDay))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [filteredEvents, selectedDay]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <div className="shrink-0 border-b border-hairline px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="type-fine text-ink-muted-48 lowercase" style={{ letterSpacing: "0.04em" }}>
              calendar
            </p>
            <p className="truncate text-base font-semibold leading-tight text-ink">
              {format(currentMonth, "MMMM yyyy")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-2.5 type-caption font-semibold"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {onSearchChange && (
        <div className="shrink-0 border-b border-hairline px-3 py-2">
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filter events…"
            className="h-8 border-hairline bg-pearl/60 type-caption"
          />
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col border-r border-hairline">
          <div className="shrink-0 border-b border-hairline px-3 py-2">
            <p className="type-caption-strong text-ink uppercase" style={{ letterSpacing: "0.06em" }}>
              Events
            </p>
            <p className="type-fine text-ink-muted-48">
              {monthEvents.length} in {format(currentMonth, "MMMM")}
            </p>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-1 p-2">
              {monthEvents.length === 0 ? (
                <p className="px-1 py-4 type-caption text-ink-muted-48">
                  {searchQuery.trim() ? "No matching events" : "No events this month"}
                </p>
              ) : (
                monthEvents.map((event) => {
                  const type = getEventVisualType(event, focusBlockEventIds, threadMeetingEventIds);
                  const styles = eventTypeClasses(type);
                  const isHighlighted = highlightedEventId === event.id;
                  const isSelectedDay = selectedDay ? eventOccursOnDay(event, selectedDay) : false;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => handleEventSelect(event)}
                      className={cn(
                        "w-full rounded-[8px] border px-2.5 py-2 text-left transition-colors",
                        styles.bg,
                        styles.border,
                        isHighlighted && "ring-1 ring-primary/50",
                        isSelectedDay && !isHighlighted && "border-primary/30"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", styles.dot)} />
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate type-caption font-semibold", styles.text)}>
                            {event.summary}
                          </p>
                          <p className="type-fine text-ink-muted-48">
                            {format(event.start, "EEE d · h:mm a")}
                            {event.attendees.length > 0 && ` · ${event.attendees.length} attendees`}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {selectedDay ? (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-hairline px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 type-caption"
                  onClick={() => setSelectedDay(null)}
                >
                  ← Month
                </Button>
                <span className="type-fine text-ink-muted-48">
                  {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? "" : "s"}
                </span>
              </div>
              <CalendarDayGrid
                date={selectedDay}
                events={filteredEvents}
                focusBlockEventIds={focusBlockEventIds}
                threadMeetingEventIds={threadMeetingEventIds}
                highlightedEventId={highlightedEventId}
                onEventClick={handleEventSelect}
                onOpenPreBrief={onOpenPreBrief}
              />
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="grid shrink-0 grid-cols-7 border-b border-hairline px-1 py-1.5 text-center">
                {WEEKDAYS.map((label, index) => (
                  <span
                    key={label}
                    className={cn(
                      "type-fine uppercase",
                      index === 0 || index === 6 ? "text-ink-muted-48" : "text-ink-muted-80"
                    )}
                    style={{ letterSpacing: "0.08em" }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px bg-hairline p-px">
                {days.map((day) => {
                  const key = format(day.date, "yyyy-MM-dd");
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const isToday = isSameDay(day.date, today);
                  const isHighlightedDay = highlightedDayKeys.has(key);
                  const inMonth = day.isCurrentMonth;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectDay(day.date)}
                      className={cn(
                        "flex min-h-0 flex-col bg-canvas px-0.5 py-1 text-left transition-colors",
                        !inMonth && "text-ink-muted-48/40",
                        inMonth && day.isWeekend && "text-ink-muted-48",
                        inMonth && !day.isWeekend && "text-ink",
                        isHighlightedDay && "bg-primary/10 ring-1 ring-inset ring-primary/35",
                        isToday && !isHighlightedDay && "bg-primary/6 ring-1 ring-inset ring-primary/20",
                        !isHighlightedDay && !isToday && "hover:bg-pearl"
                      )}
                    >
                      <span
                        className={cn(
                          "mx-auto type-caption font-semibold leading-none",
                          isToday && "text-primary"
                        )}
                      >
                        {day.dayOfMonth}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="mt-1 flex flex-wrap justify-center gap-0.5 px-0.5">
                          {dayEvents.slice(0, 3).map((event) => {
                            const type = getEventVisualType(
                              event,
                              focusBlockEventIds,
                              threadMeetingEventIds
                            );
                            const styles = eventTypeClasses(type);
                            return (
                              <span
                                key={event.id}
                                className={cn("h-1 w-1 rounded-full", styles.dot)}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="type-fine text-ink-muted-48">+</span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {onDefrag && (
        <div className="shrink-0 border-t border-hairline p-2">
          <Button variant="outline" size="sm" className="w-full type-caption" onClick={onDefrag}>
            Defrag my week
          </Button>
        </div>
      )}
    </div>
  );
}
