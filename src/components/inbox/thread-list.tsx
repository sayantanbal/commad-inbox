"use client";

import { motion } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";
import { PriorityBadge } from "@/components/inbox/priority-badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Classification, Thread, TriageLane } from "@/lib/types";

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
  selectedThreadId: string | null;
  multiSelectMode: boolean;
  selectedIds: Set<string>;
  onSelectThread: (threadId: string) => void;
  onToggleSelect: (threadId: string) => void;
}

export function ThreadList({
  lane,
  threads,
  classifications,
  selectedThreadId,
  multiSelectMode,
  selectedIds,
  onSelectThread,
  onToggleSelect,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-muted-foreground">No threads in {laneLabels[lane]}</p>
        <p className="text-xs text-muted-foreground/70">
          Press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">J</kbd> /{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">K</kbd> to navigate
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {threads.map((thread, index) => {
        const classification = classifications.get(thread.id);
        const isSelected = selectedThreadId === thread.id;
        const isChecked = selectedIds.has(thread.id);
        const sender = classification?.sender ?? thread.participants[0]?.name ?? "Unknown";
        const timeLabel = formatRelativeTime(thread.timestamp);

        return (
          <motion.button
            key={thread.id}
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => (multiSelectMode ? onToggleSelect(thread.id) : onSelectThread(thread.id))}
            className={cn(
              "group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors",
              multiSelectMode && "grid-cols-[auto_minmax(0,1fr)_auto]",
              isSelected && !multiSelectMode && "bg-accent/80",
              !isSelected && "hover:bg-accent/40"
            )}
          >
            {multiSelectMode && (
              <span className="col-start-1 row-span-2 self-center text-muted-foreground">
                {isChecked ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </span>
            )}

            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                multiSelectMode ? "col-start-2 row-start-1" : "col-start-1 row-start-1"
              )}
            >
              {thread.unread && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              )}
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  thread.unread ? "font-semibold" : "font-medium"
                )}
                title={sender}
              >
                {sender}
              </span>
            </div>

            <time
              className={cn(
                "shrink-0 self-start text-[10px] leading-5 text-muted-foreground",
                multiSelectMode ? "col-start-3 row-start-1" : "col-start-2 row-start-1"
              )}
              dateTime={thread.timestamp.toISOString()}
            >
              {timeLabel}
            </time>

            <p
              className={cn(
                "min-w-0 truncate text-sm",
                multiSelectMode ? "col-span-2 col-start-2 row-start-2" : "col-span-2 col-start-1 row-start-2",
                thread.unread ? "text-foreground" : "text-muted-foreground"
              )}
              title={thread.subject}
            >
              {thread.subject}
            </p>

            {classification && (
              <div
                className={cn(
                  "mt-0.5",
                  multiSelectMode ? "col-span-2 col-start-2 row-start-3" : "col-span-2 col-start-1 row-start-3"
                )}
              >
                <PriorityBadge priority={classification.priority} />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
