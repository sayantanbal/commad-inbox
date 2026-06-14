"use client";

import { Archive, Clock, Inbox, ListChecks, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MailboxEmptyVariant =
  | "inbox-lane"
  | "sent"
  | "snoozed"
  | "archive"
  | "commitments"
  | "waiting";

interface MailboxEmptyStateProps {
  variant: MailboxEmptyVariant;
  laneLabel?: string;
  onAction: () => void;
}

const copy: Record<
  MailboxEmptyVariant,
  { title: string; description: string; action: string; icon: typeof Inbox }
> = {
  "inbox-lane": {
    title: "Lane clear",
    description: "Nothing needs attention here right now.",
    action: "Browse other lanes",
    icon: Inbox,
  },
  sent: {
    title: "No sent mail yet",
    description: "Messages you send will show up here.",
    action: "Compose email",
    icon: Send,
  },
  snoozed: {
    title: "Nothing snoozed",
    description: "Snooze a thread with S when you want to come back later.",
    action: "Browse inbox",
    icon: Clock,
  },
  archive: {
    title: "Archive is empty",
    description: "Archived threads land here when you press E or move to Done.",
    action: "Go to inbox",
    icon: Archive,
  },
  commitments: {
    title: "No open commitments",
    description: "Promises you make in email threads will appear here automatically.",
    action: "Browse inbox",
    icon: ListChecks,
  },
  waiting: {
    title: "Nothing you're waiting on",
    description: "When someone owes you a reply or deliverable, it shows up here.",
    action: "Browse inbox",
    icon: Clock,
  },
};

export function MailboxEmptyState({ variant, laneLabel, onAction }: MailboxEmptyStateProps) {
  const content = copy[variant];
  const Icon = content.icon;
  const title =
    variant === "inbox-lane" && laneLabel
      ? `Nothing in ${laneLabel}`
      : content.title;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pearl text-ink-muted-48">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="space-y-2">
        <p className="type-body-strong text-ink">{title}</p>
        <p className="type-caption text-ink-muted-48 max-w-xs">{content.description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onAction}>
        {content.action}
      </Button>
    </div>
  );
}
