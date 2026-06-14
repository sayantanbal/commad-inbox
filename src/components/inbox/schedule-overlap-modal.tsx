"use client";

import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CalendarEvent } from "@/lib/types";

interface ScheduleOverlapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingEvent: CalendarEvent | null;
  proposedStart: Date | null;
  onRescheduleConflict: () => void;
  onPickAnotherTime: () => void;
}

export function ScheduleOverlapModal({
  open,
  onOpenChange,
  conflictingEvent,
  proposedStart,
  onRescheduleConflict,
  onPickAnotherTime,
}: ScheduleOverlapModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 type-tagline text-ink">
            <AlertCircle className="h-4 w-4 text-[color:var(--color-warning)]" />
            Time conflict
          </DialogTitle>
        </DialogHeader>
        <p className="type-caption text-ink-muted-48">
          {proposedStart
            ? `${format(proposedStart, "EEE, MMM d · h:mm a")} overlaps with another event.`
            : "This time overlaps with another event."}
        </p>
        {conflictingEvent && (
          <div className="rounded-[8px] border border-hairline bg-pearl px-3 py-2 type-caption text-ink">
            <p className="type-caption-strong">{conflictingEvent.summary}</p>
            <p className="type-fine text-ink-muted-48">
              {format(conflictingEvent.start, "EEE h:mm a")} –{" "}
              {format(conflictingEvent.end, "h:mm a")}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onRescheduleConflict}>Reschedule conflicting event</Button>
          <Button variant="outline" onClick={onPickAnotherTime}>
            Pick another time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
