"use client";

import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SchedulingIntent } from "@/lib/types";

interface AvailabilityPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedulingIntent: SchedulingIntent | null;
  freeSlots: Date[];
  onSelectSlot: (slot: Date) => void;
}

export function AvailabilityPicker({
  open,
  onOpenChange,
  schedulingIntent,
  freeSlots,
  onSelectSlot,
}: AvailabilityPickerProps) {
  const isManualMode =
    !schedulingIntent || schedulingIntent.confidence < 0.5 || schedulingIntent.proposedTimes.length === 0;

  const proposedSlots = schedulingIntent?.proposedTimes ?? [];
  const duration = schedulingIntent?.duration ?? 30;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {isManualMode ? "Pick a time" : "Schedule meeting"}
          </DialogTitle>
        </DialogHeader>

        {isManualMode ? (
          <p className="text-sm text-muted-foreground">
            No confident scheduling intent found. Choose from your next free slots ({duration} min).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Proposed times from the email are highlighted. Press Enter on a slot to confirm.
          </p>
        )}

        {!isManualMode && proposedSlots.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From email</p>
            <div className="flex flex-wrap gap-2">
              {proposedSlots.map((slot) => (
                <Button
                  key={slot.toISOString()}
                  variant="default"
                  size="sm"
                  onClick={() => onSelectSlot(slot)}
                  className="gap-1.5"
                >
                  <Clock className="h-3 w-3" />
                  {format(slot, "EEE h:mm a")}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your availability</p>
          <div className="space-y-1">
            {freeSlots.map((slot) => (
              <button
                key={slot.toISOString()}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {format(slot, "EEE, MMM d · h:mm a")}
                <span className="ml-auto text-xs text-muted-foreground">{duration}m</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
