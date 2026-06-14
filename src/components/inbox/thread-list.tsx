"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Archive, CheckSquare, Clock, Square } from "lucide-react";
import { PriorityBadge } from "@/components/inbox/priority-badge";
import { RsvpChip } from "@/components/inbox/rsvp-chip";
import { SwipeableThreadRow } from "@/components/inbox/swipeable-thread-row";
import { KbdSequence } from "@/components/ui/kbd-badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { RsvpSummary } from "@/lib/inbox/rsvp";
import type {
  Classification,
  Thread,
  ThreadMeeting,
  TriageLane,
} from "@/lib/types";

const laneLabels: Record<TriageLane, string> = {
  reply: "Reply",
  schedule: "Schedule",
  fyi: "FYI",
  done: "Done",
};

interface ThreadListProps {
  lane: TriageLane;
  threads: Thread[];
  classifications: Map<string, Classification>;
  threadMeetings: Map<string, ThreadMeeting>;
  rsvpByThread: Map<string, RsvpSummary>;
  selectedThreadId: string | null;
  multiSelectMode: boolean;
  selectedIds: Set<string>;
  onSelectThread: (threadId: string) => void;
  onToggleSelect: (threadId: string) => void;
  touchEnabled?: boolean;
  onArchiveThread?: (threadId: string) => void;
  onSnoozeThread?: (threadId: string) => void;
  onLongPressThread?: (threadId: string) => void;
}

export function ThreadList({
  lane,
  threads,
  classifications,
  threadMeetings,
  rsvpByThread,
  selectedThreadId,
  multiSelectMode,
  selectedIds,
  onSelectThread,
  onToggleSelect,
  touchEnabled = false,
  onArchiveThread,
  onSnoozeThread,
  onLongPressThread,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="type-body text-ink">
          Nothing in {laneLabels[lane]}. Everything&rsquo;s in play.
        </p>
        <p className="type-caption text-ink-muted-48 flex items-center justify-center gap-2">
          Move with
          <KbdSequence keys={["J", "K"]} />
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {threads.map((thread, index) => {
        const classification = classifications.get(thread.id);
        const meeting = threadMeetings.get(thread.id);
        const rsvp = rsvpByThread.get(thread.id);
        const isSelected = selectedThreadId === thread.id;
        const isChecked = selectedIds.has(thread.id);
        const sender =
          classification?.sender ?? thread.participants[0]?.name ?? "Unknown";
        const timeLabel = formatRelativeTime(thread.timestamp);
        const meetingTime = meeting ? format(meeting.start, "EEE h:mm a") : null;

        const row = (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.2 }}
            className={cn(
              "group relative flex w-full items-start gap-3 border-b border-divider-soft px-4 py-3 text-left transition-colors",
              "min-h-[72px]",
              isSelected && !multiSelectMode
                ? "thread-selected"
                : "hover:bg-pearl"
            )}
          >
            {multiSelectMode && (
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-ink-muted-48">
                {isChecked ? (
                  <CheckSquare className="h-4 w-4 text-primary" strokeWidth={1.75} />
                ) : (
                  <Square className="h-4 w-4" strokeWidth={1.75} />
                )}
              </span>
            )}

            {/* Unread indicator + main content */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {/* Row 1: sender + timestamp */}
              <div className="flex items-baseline gap-2">
                {thread.unread && (
                  <span
                    className="mt-[5px] h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    thread.unread ? "type-body-strong text-ink" : "type-body text-ink"
                  )}
                  title={sender}
                >
                  {sender}
                </span>
                <time
                  className="flex-shrink-0 type-fine text-ink-muted-48"
                  dateTime={thread.timestamp.toISOString()}
                >
                  {timeLabel}
                </time>
              </div>

              {/* Row 2: subject */}
              <p
                className={cn(
                  "type-caption truncate",
                  thread.unread ? "text-ink" : "text-ink-muted-80"
                )}
                title={thread.subject}
              >
                {thread.subject}
              </p>

              {/* Row 3: preview snippet */}
              {thread.snippet && (
                <p className="type-caption text-ink-muted-48 truncate">
                  {thread.snippet}
                </p>
              )}

              {/* Metadata chips */}
              {(classification || meetingTime || rsvp) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {classification && <PriorityBadge priority={classification.priority} />}
                  {meetingTime && (
                    <span className="type-fine text-ink-muted-48 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      {meetingTime}
                    </span>
                  )}
                  {rsvp && <RsvpChip summary={rsvp} />}
                </div>
              )}
            </div>

            {/* Hover action buttons */}
            {!multiSelectMode && (
              <div
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "pointer-events-none group-hover:pointer-events-auto"
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveThread?.(thread.id);
                  }}
                  className="btn-icon-circular btn-icon-circular--sm"
                  aria-label="Archive (E)"
                  title="Archive — E"
                >
                  <Archive className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSnoozeThread?.(thread.id);
                  }}
                  className="btn-icon-circular btn-icon-circular--sm"
                  aria-label="Snooze (S)"
                  title="Snooze — S"
                >
                  <Clock className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            )}
          </motion.div>
        );

        if (touchEnabled && !multiSelectMode) {
          return (
            <SwipeableThreadRow
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              onSwipeRight={() => onArchiveThread?.(thread.id)}
              onSwipeLeft={() => onSnoozeThread?.(thread.id)}
              onLongPress={() => onLongPressThread?.(thread.id)}
            >
              {row}
            </SwipeableThreadRow>
          );
        }

        return (
          <div
            key={thread.id}
            onClick={() =>
              multiSelectMode
                ? onToggleSelect(thread.id)
                : onSelectThread(thread.id)
            }
            className="cursor-pointer"
          >
            {row}
          </div>
        );
      })}
    </div>
  );
}
