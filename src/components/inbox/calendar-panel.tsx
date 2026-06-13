"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCalendarDays } from "@/lib/calendar-days";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarViewMode = "month" | "day";

interface CalendarPanelProps {
  events: CalendarEvent[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onDefrag?: () => void;
}

export function CalendarPanel({
  events,
  searchQuery = "",
  onSearchChange,
  onDefrag,
}: CalendarPanelProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const today = new Date();

  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.summary.toLowerCase().includes(q) ||
        e.attendees.some(
          (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
        )
    );
  }, [events, searchQuery]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const key = format(event.start, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [filteredEvents]);

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(startOfMonth(now));
    setSelectedDay(now);
    setWeekStart(startOfWeek(now, { weekStartsOn: 0 }));
  };

  const selectDay = (date: Date) => {
    setSelectedDay(date);
    setCurrentMonth(startOfMonth(date));
    setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] lowercase tracking-wide text-muted-foreground">calendar</p>
            <p className="truncate text-base font-semibold leading-tight">
              {viewMode === "month"
                ? format(currentMonth, "MMMM yyyy")
                : `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex rounded-full border border-border bg-secondary/40 p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  viewMode === "month"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  viewMode === "day"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Day
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => {
                  if (viewMode === "month") {
                    setCurrentMonth((m) => addMonths(m, -1));
                  } else {
                    setWeekStart((w) => addWeeks(w, -1));
                  }
                }}
                aria-label={viewMode === "month" ? "Previous month" : "Previous week"}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2.5 text-[10px] font-medium"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => {
                  if (viewMode === "month") {
                    setCurrentMonth((m) => addMonths(m, 1));
                  } else {
                    setWeekStart((w) => addWeeks(w, 1));
                  }
                }}
                aria-label={viewMode === "month" ? "Next month" : "Next week"}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {onSearchChange && (
        <div className="shrink-0 border-b border-border px-3 py-2">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter events…"
            className="h-8 border-border/60 bg-secondary/30 text-xs"
          />
        </div>
      )}

      {viewMode === "month" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid shrink-0 grid-cols-7 border-b border-border/60 px-1.5 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider">
            {WEEKDAYS.map((label, i) => (
              <span
                key={label}
                className={cn(i === 0 || i === 6 ? "text-muted-foreground/70" : "text-muted-foreground")}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px p-1.5">
            {days.map((day) => {
              const key = format(day.date, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(key) ?? [];
              const isToday = isSameDay(day.date, today);
              const isSelected = isSameDay(day.date, selectedDay);
              const inMonth = isSameMonth(day.date, currentMonth);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(day.date)}
                  className={cn(
                    "flex min-h-0 flex-col items-center justify-center rounded-sm px-0.5 py-0.5 text-[10px] leading-none transition-colors",
                    !inMonth && "text-muted-foreground/35",
                    inMonth && day.isWeekend && "text-muted-foreground",
                    inMonth && !day.isWeekend && "text-foreground",
                    isSelected && "bg-primary/15 ring-1 ring-primary/40",
                    isToday && !isSelected && "bg-primary/8 ring-1 ring-primary/25",
                    !isSelected && !isToday && "hover:bg-accent"
                  )}
                >
                  <span className={cn("font-semibold", isToday && "text-primary")}>
                    {day.dayOfMonth}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="mt-0.5 flex items-center gap-px">
                      {dayEvents.length <= 2 ? (
                        dayEvents.map((e) => (
                          <span
                            key={e.id}
                            className={cn(
                              "h-1 w-1 rounded-full",
                              e.status === "tentative" ? "bg-amber-500" : "bg-foreground/60"
                            )}
                          />
                        ))
                      ) : (
                        <span className="text-[8px] text-muted-foreground">··</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(key) ?? [];
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-md border px-2 py-2 transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent hover:border-border/60 hover:bg-accent/30"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className="mb-1.5 flex w-full items-baseline justify-between text-left"
                  >
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {format(day, "EEE d")}
                    </span>
                    {isToday && (
                      <span className="text-[10px] uppercase tracking-wide text-primary">Today</span>
                    )}
                  </button>
                  {dayEvents.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60">
                      {searchQuery.trim() ? "No matching events" : "Free"}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded border border-border/60 bg-secondary/50 px-2 py-1.5"
                        >
                          <p className="truncate text-xs font-medium">{event.summary}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(event.start, "h:mm a")}
                            {event.attendees.length > 0 && ` · ${event.attendees.length} attendees`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {onDefrag && (
        <div className="shrink-0 border-t border-border p-2">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={onDefrag}>
            Defrag my week
          </Button>
        </div>
      )}
    </div>
  );
}
