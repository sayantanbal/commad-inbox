"use client";

import { addDays, format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

interface CalendarWeekStripProps {
  events: CalendarEvent[];
  weekStart: Date;
  onWeekChange: (direction: -1 | 1) => void;
  onDefrag?: () => void;
}

export function CalendarWeekStrip({ events, weekStart, onWeekChange, onDefrag }: CalendarWeekStripProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const now = new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">This week</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onWeekChange(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onWeekChange(1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(e.start, day));
            const isToday = isSameDay(day, now);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-md border border-transparent px-2 py-2",
                  isToday && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                    {format(day, "EEE d")}
                  </span>
                  {isToday && (
                    <span className="text-[10px] uppercase tracking-wide text-primary">Today</span>
                  )}
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/60">Free</p>
                ) : (
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded border border-border/60 bg-secondary/50 px-2 py-1.5"
                      >
                        <p className="truncate text-xs font-medium">{event.summary}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(event.start, "h:mm a")} · {event.attendees.length || "solo"}
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

      {onDefrag && (
        <div className="border-t border-border p-2">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={onDefrag}>
            Defrag my week
          </Button>
        </div>
      )}
    </div>
  );
}
