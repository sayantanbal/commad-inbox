"use client";

import { format } from "date-fns";
import { Calendar, Clock, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RsvpChip } from "@/components/inbox/rsvp-chip";
import type { RsvpSummary } from "@/lib/inbox/rsvp";
import type { CalendarEvent, ThreadMeeting } from "@/lib/types";

interface MeetingBannerProps {
  meeting: ThreadMeeting;
  event: CalendarEvent | null;
  rsvp: RsvpSummary;
  onReschedule: () => void;
  onCancel: () => void;
}

export function MeetingBanner({
  meeting,
  event,
  rsvp,
  onReschedule,
  onCancel,
}: MeetingBannerProps) {
  const end = new Date(meeting.start.getTime() + meeting.durationMinutes * 60_000);

  return (
    <div className="border-b border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <p className="text-sm font-medium">Meeting scheduled</p>
            <RsvpChip summary={rsvp} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(meeting.start, "EEE, MMM d · h:mm a")} – {format(end, "h:mm a")}
            <span>· {meeting.durationMinutes}m</span>
          </p>
          {event?.location && (
            <a
              href={event.location}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Video className="h-3 w-3" />
              Join Google Meet
            </a>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onReschedule}>
            Reschedule
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={onCancel}
          >
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
