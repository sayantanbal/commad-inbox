"use client";

import { useMemo } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Bell, Check, Clock, Loader2, X } from "lucide-react";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CommitmentItem } from "@/lib/inbox/client-api";

interface CommitmentsPanelProps {
  open: boolean;
  title: string;
  focusColumn?: "commitments" | "waiting";
  loading?: boolean;
  commitments: CommitmentItem[];
  onClose: () => void;
  onBrowseInbox: () => void;
  onSelectThread: (threadId: string) => void;
  onFulfill: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function CommitmentsPanel({
  open,
  title,
  focusColumn,
  loading = false,
  commitments,
  onClose,
  onBrowseInbox,
  onSelectThread,
  onFulfill,
  onDismiss,
}: CommitmentsPanelProps) {
  const { mine, waiting } = useMemo(() => {
    const mine: CommitmentItem[] = [];
    const waiting: CommitmentItem[] = [];
    for (const item of commitments) {
      if (item.direction === "outbound") mine.push(item);
      else waiting.push(item);
    }
    return { mine, waiting };
  }, [commitments]);

  if (!open) return null;

  const singleColumn = focusColumn != null;
  const showCommitments = !singleColumn || focusColumn === "commitments";
  const showWaiting = !singleColumn || focusColumn === "waiting";

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <div>
          <h2 className="type-tagline text-ink">{title}</h2>
          <p className="mt-1 type-caption text-ink-muted-48">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                Scanning threads for commitments…
              </span>
            ) : (
              <>
                {mine.length} commitment{mine.length === 1 ? "" : "s"} · {waiting.length} waiting
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 type-caption text-ink-muted-80 hover:text-ink transition-colors"
        >
          Close
          <KbdBadge>Esc</KbdBadge>
        </button>
      </header>

      {loading ? (
        <div className="flex flex-1 flex-col gap-4 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-[18px]" />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid flex-1 overflow-hidden",
            singleColumn ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 md:divide-x md:divide-hairline"
          )}
        >
          {showCommitments && (
            <Column
              heading="My commitments"
              emptyTitle="No open commitments"
              emptyDescription="Promises you make in email threads will appear here automatically."
              emptyAction="Browse inbox"
              items={mine}
              onEmptyAction={onBrowseInbox}
              onSelectThread={onSelectThread}
              onFulfill={onFulfill}
              onDismiss={onDismiss}
            />
          )}
          {showWaiting && (
            <Column
              heading="Waiting for"
              emptyTitle="Nothing you're waiting on"
              emptyDescription="When someone owes you a reply or deliverable, it shows up here."
              emptyAction="Browse inbox"
              waiting
              items={waiting}
              onEmptyAction={onBrowseInbox}
              onSelectThread={onSelectThread}
              onFulfill={onFulfill}
              onDismiss={onDismiss}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Column({
  heading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  items,
  waiting = false,
  onEmptyAction,
  onSelectThread,
  onFulfill,
  onDismiss,
}: {
  heading: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: string;
  items: CommitmentItem[];
  waiting?: boolean;
  onEmptyAction: () => void;
  onSelectThread: (id: string) => void;
  onFulfill: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <p
        className="type-caption-strong text-ink-muted-48 uppercase px-6 py-3 border-b border-divider-soft"
        style={{ letterSpacing: "0.06em" }}
      >
        {heading}
      </p>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 px-3 py-16 text-center">
            <p className="type-body-strong text-ink">{emptyTitle}</p>
            <p className="type-caption text-ink-muted-48 max-w-xs">{emptyDescription}</p>
            <Button variant="outline" size="sm" onClick={onEmptyAction}>
              {emptyAction}
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              item={item}
              waiting={waiting}
              onSelectThread={onSelectThread}
              onFulfill={onFulfill}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>
    </section>
  );
}

function Card({
  item,
  waiting,
  onSelectThread,
  onFulfill,
  onDismiss,
}: {
  item: CommitmentItem;
  waiting: boolean;
  onSelectThread: (id: string) => void;
  onFulfill: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const due = item.dueDate ? new Date(item.dueDate) : null;
  const overdue = due ? isPast(due) && item.status !== "done" : false;
  const done = item.status === "done";

  return (
    <article
      className={cn(
        "rounded-[18px] border border-hairline bg-canvas p-4 transition-colors hover:bg-pearl",
        overdue && "thread-overdue"
      )}
    >
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onSelectThread(item.threadId)}
      >
        <p className="type-caption text-ink-muted-48 truncate">
          {waiting ? "From: " : "Re: "}
          {item.counterpartyEmail}
        </p>
        <p
          className={cn(
            "mt-1 type-body-strong",
            done ? "text-ink-muted-48 line-through" : "text-ink"
          )}
        >
          {item.text}
        </p>
      </button>

      <div className="mt-3 flex items-center gap-2">
        {due ? (
          <span
            className={cn(
              "btn-pearl-capsule type-fine",
              overdue && "!text-[color:var(--color-destructive)]"
            )}
            style={{ padding: "4px 10px" }}
          >
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {overdue ? "Overdue · " : "Due "}
            {format(due, "MMM d")}
          </span>
        ) : (
          <span
            className="type-fine text-ink-muted-48 inline-flex items-center gap-1"
            title={item.dueDate ?? undefined}
          >
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {waiting
              ? `${formatDistanceToNow(new Date(), { addSuffix: false })} waiting`
              : "No due date"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {waiting ? (
            <button
              type="button"
              onClick={() => onFulfill(item.id)}
              className="btn-pearl-capsule type-fine"
              style={{ padding: "4px 10px" }}
            >
              <Bell className="h-3 w-3" strokeWidth={1.75} />
              Send nudge
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onFulfill(item.id)}
              className="btn-pearl-capsule type-fine"
              style={{ padding: "4px 10px" }}
            >
              <Check className="h-3 w-3" strokeWidth={1.75} />
              Done
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="btn-icon-circular btn-icon-circular--sm !h-7 !w-7"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </article>
  );
}
