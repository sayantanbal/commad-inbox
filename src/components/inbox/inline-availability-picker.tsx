"use client";

import { addMinutes, format } from "date-fns";
import { AlertCircle, Calendar, Clock, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  findNearestFreeSlot,
  isSlotBusy,
  isSlotBusyForAttendees,
  type BusyInterval,
} from "@/lib/calendar/free-slots";
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
  previousSlotStart?: Date | null;
  excludeEventId?: string;
  attendees: string[];
  attendeeBusy?: BusyInterval[];
  onDurationChange?: (minutes: 30 | 45 | 60) => void;
  onCustomTime?: () => void;
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
  previousSlotStart,
  excludeEventId,
  attendees,
  attendeeBusy = [],
  onDurationChange,
  onCustomTime,
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
  const duration = durationMinutes;

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

  const slotIsBusy = useCallback(
    (slot: Date, end: Date) =>
      isSlotBusy(calendarEvents, slot, end, excludeEventId) ||
      isSlotBusyForAttendees(attendeeBusy, slot, end),
    [attendeeBusy, calendarEvents, excludeEventId]
  );

  const handleSlotSelect = useCallback((slot: Date) => {
    const end = addMinutes(slot, duration);
    if (slotIsBusy(slot, end)) {
      const alternative = findNearestFreeSlot(calendarEvents, duration, slot, {
        excludeEventId,
      });
      if (alternative && !slotIsBusy(alternative, addMinutes(alternative, duration))) {
        setConflictHint(
          `${format(slot, "EEE h:mm a")} conflicts — nearest free slot is ${format(alternative, "EEE h:mm a")}.`
        );
        const altIndex = slotOptions.findIndex(
          (option) => option.toISOString() === alternative.toISOString()
        );
        if (altIndex >= 0) setHighlightIndex(altIndex);
        onSelectSlot(alternative);
        return;
      }
      setConflictHint(
        `${format(slot, "EEE h:mm a")} is busy and no nearby slot was found. Pick another time.`
      );
      return;
    }
    setConflictHint(null);
    onSelectSlot(slot);
  }, [calendarEvents, duration, excludeEventId, onSelectSlot, slotIsBusy, slotOptions]);

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
  }, [handleSlotSelect, highlightIndex, onClose, open, slotOptions]);

  if (!open) return null;

  const title =
    mode === "reschedule"
      ? "Reschedule meeting"
      : isManualMode
      ? "Pick a time"
      : "Schedule a meeting";

  return (
    <section
      className="border-b border-hairline bg-canvas px-6 py-5"
      aria-label="Availability picker"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="type-tagline text-ink flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" strokeWidth={1.75} />
            {title}
          </p>
          <p className="mt-2 type-caption text-ink-muted-48 max-w-md">
            {isManualMode
              ? `Choose a free ${duration}-minute slot. Busy times come straight from Calendar.`
              : "Times proposed by the email, validated against your calendar."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-icon-circular btn-icon-circular--sm"
          aria-label="Close availability picker"
        >
          ×
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([30, 45, 60] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDurationChange?.(d)}
            className="chip-option"
            data-selected={duration === d ? "true" : "false"}
          >
            {d} min
          </button>
        ))}
        {onCustomTime && (
          <button type="button" onClick={onCustomTime} className="btn-pearl-capsule">
            Custom time…
          </button>
        )}
        <span className="type-caption text-ink-muted-48 ml-2">
          ↑↓ navigate · ↵ confirm · Esc close
        </span>
      </div>

      {mode === "reschedule" && previousSlotStart && (
        <div className="mb-4 rounded-[8px] border-2 border-[color:var(--color-success)] bg-[rgba(52,199,89,0.08)] px-3 py-2 type-caption text-ink">
          Previous time: {format(previousSlotStart, "EEE, MMM d · h:mm a")}
        </div>
      )}

      {conflictHint && (
        <div className="mb-4 flex items-start gap-2 rounded-[8px] border border-[color:var(--color-warning)]/30 bg-[#fff7e6] px-3 py-2 type-caption text-[color:var(--color-warning)]">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {conflictHint}
        </div>
      )}

      {attendees.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 type-caption text-ink-muted-48">
          <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
          {attendees.map((email) => (
            <span
              key={email}
              className="rounded-full border border-hairline px-2 py-0.5 type-fine"
            >
              {email}
            </span>
          ))}
        </div>
      )}

      {!isManualMode && proposedSlots.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="type-caption-strong uppercase text-ink-muted-48" style={{ letterSpacing: "0.06em" }}>
            From email
          </p>
          <div className="flex flex-wrap gap-2">
            {proposedSlots.map((slot) => {
              const end = addMinutes(slot, duration);
              const busy = slotIsBusy(slot, end);
              const index = slotOptions.findIndex(
                (option) => option.toISOString() === slot.toISOString()
              );
              return (
                <Button
                  key={slot.toISOString()}
                  variant={busy ? "pearl-capsule" : "default"}
                  size="xs"
                  onClick={() => handleSlotSelect(slot)}
                  className={cn(
                    index === highlightIndex && "ring-2 ring-[color:var(--color-primary-focus)]"
                  )}
                >
                  <Clock className="h-3 w-3" strokeWidth={1.75} />
                  {format(slot, "EEE h:mm a")}
                  {busy && (
                    <span className="type-fine text-ink-muted-48 ml-1">· busy</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="type-caption-strong uppercase text-ink-muted-48" style={{ letterSpacing: "0.06em" }}>
          {isManualMode ? "Your availability" : "Your free slots"}
        </p>
        {slotOptions.length === 0 ? (
          <p className="type-body text-ink-muted-48">
            No open slots in the next two weeks.
          </p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {slotOptions.map((slot, index) => {
              const end = addMinutes(slot, duration);
              const busy = slotIsBusy(slot, end);
              const fromEmail = proposedSlots.some(
                (proposed) => proposed.toISOString() === slot.toISOString()
              );
              const isHighlight = index === highlightIndex;
              return (
                <button
                  key={slot.toISOString()}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  className={cn(
                    "flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-left type-caption transition-colors",
                    fromEmail && !isManualMode && !busy
                      ? "border-l-2 border-primary bg-[rgba(0,102,204,0.10)] text-ink"
                      : "border-hairline text-ink",
                    !busy && "hover:bg-pearl",
                    busy &&
                      "border-hairline bg-pearl/40 text-ink-muted-48 line-through decoration-ink-muted-48/60 cursor-not-allowed",
                    isHighlight && !busy && "ring-2 ring-[color:var(--color-primary-focus)]"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-ink-muted-48" strokeWidth={1.75} />
                  <span className="min-w-0 truncate">
                    {format(slot, "EEE, MMM d · h:mm a")}
                  </span>
                  <span className="ml-auto shrink-0 type-fine text-ink-muted-48">
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
