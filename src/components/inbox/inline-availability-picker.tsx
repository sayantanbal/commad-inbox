"use client";

import { addMinutes, format } from "date-fns";
import { AlertCircle, Calendar, Clock, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { findNearestFreeSlot, isSlotBusy } from "@/lib/calendar/free-slots";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import type { SchedulingIntent } from "@/lib/types";

interface InlineAvailabilityPickerProps {
  open: boolean;
  mode: "create" | "reschedule";
  schedulingIntent: SchedulingIntent | null;
  freeSlots: Date[];
  calendarEvents: CalendarEvent[];
  durationMinutes: number;
  excludeEventId?: string;
  attendees: string[];
  onClose: () => void;
  onSelectSlot: (slot: Date) => void;
}

export function InlineAvailabilityPicker({
  open,
  mode,
  schedulingIntent,
  freeSlots,
  calendarEvents,
  durationMinutes,
  excludeEventId,
  attendees,
  onClose,
  onSelectSlot,
}: InlineAvailabilityPickerProps) {
  const isManualMode =
    !schedulingIntent ||
    schedulingIntent.confidence < 0.5 ||
    schedulingIntent.proposedTimes.length === 0;

  const proposedSlots = useMemo(
    () => schedulingIntent?.proposedTimes ?? [],
    [schedulingIntent?.proposedTimes]
  );
  const duration = schedulingIntent?.duration ?? durationMinutes;

  const slotOptions = useMemo(() => {
    const proposedKeys = new Set(proposedSlots.map((slot) => slot.toISOString()));
    const merged = [...proposedSlots, ...freeSlots.filter((slot) => !proposedKeys.has(slot.toISOString()))];
    return merged.slice(0, 12);
  }, [freeSlots, proposedSlots]);

  const [highlightIndex, setHighlightIndex] = useState(0);
  const [conflictHint, setConflictHint] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setHighlightIndex(0);
      setConflictHint(null);
    }
  }, [open, slotOptions.length]);

  const handleSlotSelect = (slot: Date) => {
    const end = addMinutes(slot, duration);
    if (isSlotBusy(calendarEvents, slot, end, excludeEventId)) {
      const alternative = findNearestFreeSlot(calendarEvents, duration, slot, excludeEventId);
      if (alternative) {
        setConflictHint(
          `${format(slot, "EEE h:mm a")} conflicts with another event — nearest free slot is ${format(alternative, "EEE h:mm a")}.`
        );
        const altIndex = slotOptions.findIndex((option) => option.toISOString() === alternative.toISOString());
        if (altIndex >= 0) setHighlightIndex(altIndex);
        onSelectSlot(alternative);
        return;
      }
      setConflictHint(`${format(slot, "EEE h:mm a")} is busy and no nearby slot was found. Pick another time.`);
      return;
    }
    setConflictHint(null);
    onSelectSlot(slot);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (slotOptions.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((index) => Math.min(index + 1, slotOptions.length - 1));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((index) => Math.max(index - 1, 0));
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const slot = slotOptions[highlightIndex];
        if (slot) handleSlotSelect(slot);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [highlightIndex, onClose, open, slotOptions]);

  if (!open) return null;

  const title = mode === "reschedule" ? "Reschedule meeting" : isManualMode ? "Pick a time" : "Schedule meeting";

  return (
    <section
      className="border-b border-border bg-card/80 px-4 py-3"
      aria-label="Availability picker"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            {title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isManualMode
              ? `Choose a free slot (${duration} min). Busy times are checked against your calendar.`
              : "Proposed times from the email are checked against your calendar. ↑↓ navigate · Enter confirm · Esc close."}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>

      {conflictHint && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {conflictHint}
        </div>
      )}

      {attendees.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {attendees.map((email) => (
            <span key={email} className="rounded-md border border-border px-1.5 py-0.5">
              {email}
            </span>
          ))}
        </div>
      )}

      {!isManualMode && proposedSlots.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            From email
          </p>
          <div className="flex flex-wrap gap-2">
            {proposedSlots.map((slot) => {
              const end = addMinutes(slot, duration);
              const busy = isSlotBusy(calendarEvents, slot, end, excludeEventId);
              const index = slotOptions.findIndex(
                (option) => option.toISOString() === slot.toISOString()
              );
              return (
                <Button
                  key={slot.toISOString()}
                  variant={busy ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleSlotSelect(slot)}
                  className={cn("gap-1.5", index === highlightIndex && "ring-2 ring-ring", busy && "border-amber-500/40")}
                >
                  <Clock className="h-3 w-3" />
                  {format(slot, "EEE h:mm a")}
                  {busy && <span className="text-[10px] opacity-70">· busy</span>}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {isManualMode ? "Your availability" : "Your free slots"}
        </p>
        {slotOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open slots in the next two weeks.</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {slotOptions.map((slot, index) => {
              const end = addMinutes(slot, duration);
              const busy = isSlotBusy(calendarEvents, slot, end, excludeEventId);
              const fromEmail = proposedSlots.some(
                (proposed) => proposed.toISOString() === slot.toISOString()
              );
              return (
                <button
                  key={slot.toISOString()}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                    fromEmail && !isManualMode
                      ? "border-primary/40 bg-primary/5"
                      : "border-border",
                    busy && "opacity-60",
                    index === highlightIndex && "ring-2 ring-ring"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate">{format(slot, "EEE, MMM d · h:mm a")}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {busy ? "busy" : `${duration}m`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
