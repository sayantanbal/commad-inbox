"use client";

import { Archive, Calendar, Clock, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/utils";
import type { Thread } from "@/lib/types";

interface ThreadViewProps {
  thread: Thread | null;
  modLabel: string;
  onReply: () => void;
  onArchive: () => void;
  onSchedule: () => void;
  onSnooze: () => void;
}

function ShortcutButton({
  label,
  shortcut,
  icon: Icon,
  onClick,
}: {
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" onClick={onClick} className="gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
          <kbd className="ml-1 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
            {shortcut}
          </kbd>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ThreadView({
  thread,
  modLabel,
  onReply,
  onArchive,
  onSchedule,
  onSnooze,
}: ThreadViewProps) {
  if (!thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted-foreground">Select a thread to read</p>
        <p className="text-xs text-muted-foreground/70">
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">J</kbd> /{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">K</kbd> navigate ·{" "}
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">{modLabel}K</kbd> command palette
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-4 py-2">
        <ShortcutButton label="Reply" shortcut="R" icon={Reply} onClick={onReply} />
        <ShortcutButton label="Archive" shortcut="E" icon={Archive} onClick={onArchive} />
        <ShortcutButton label="Meeting" shortcut="M" icon={Calendar} onClick={onSchedule} />
        <ShortcutButton label="Snooze" shortcut="S" icon={Clock} onClick={onSnooze} />
      </div>

      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold leading-tight">{thread.subject}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {thread.participants.map((p) => p.name).join(", ")}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          {thread.messages.map((message) => (
            <article key={message.id}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-sm font-medium">{message.from.name}</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(message.timestamp)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{message.body}</p>
              {message.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.attachments.map((att) => (
                    <span
                      key={att.id}
                      className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground"
                    >
                      {att.filename}
                    </span>
                  ))}
                </div>
              )}
              <Separator className="mt-6" />
            </article>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
