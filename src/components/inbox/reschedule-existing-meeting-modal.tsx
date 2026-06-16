"use client";

import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CalendarEvent } from "@/lib/types";

interface RescheduleExistingMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedEvent: CalendarEvent | null;
  onConfirm: () => void;
}

export function RescheduleExistingMeetingModal({
  open,
  onOpenChange,
  linkedEvent,
  onConfirm,
}: RescheduleExistingMeetingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 type-tagline text-ink">
            <CalendarClock className="h-4 w-4 text-primary" />
            Reschedule existing meeting?
          </DialogTitle>
        </DialogHeader>
        <p className="type-caption text-ink-muted-48">
          This thread already has a calendar event linked. Pick a new time to update the invite
          in place — attendees will get an update, not a second meeting.
        </p>
        {linkedEvent && (
          <div className="rounded-[8px] border border-hairline bg-pearl px-3 py-2 type-caption text-ink">
            <p className="type-caption-strong">{linkedEvent.summary}</p>
            <p className="type-fine text-ink-muted-48">
              {format(linkedEvent.start, "EEE, MMM d · h:mm a")} –{" "}
              {format(linkedEvent.end, "h:mm a")}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onConfirm}>Pick new time</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
