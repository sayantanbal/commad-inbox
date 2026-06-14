"use client";

import { EmailHtmlFrame } from "@/components/inbox/email-html-frame";
import { InlineAvailabilityPicker } from "@/components/inbox/inline-availability-picker";
import { MeetingBanner } from "@/components/inbox/meeting-banner";
import { ThreadSummaryBox } from "@/components/inbox/thread-summary-box";
import { Archive, Calendar, Clock, FileText, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KbdBadge, KbdSequence } from "@/components/ui/kbd-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RsvpSummary } from "@/lib/inbox/rsvp";
import type { AiProvider } from "@/lib/ai/providers";
import type { SuggestedAction } from "@/lib/schemas/domain";
import { formatRelativeTime } from "@/lib/utils";
import type { CalendarEvent, SchedulingIntent, Thread, ThreadMeeting } from "@/lib/types";
import type { CommitmentItem } from "@/lib/inbox/client-api";

interface ThreadViewProps {
  thread: Thread | null;
  modLabel: string;
  linkedMeeting: ThreadMeeting | null;
  linkedEvent: CalendarEvent | null;
  rsvpSummary: RsvpSummary;
  availabilityOpen: boolean;
  availabilityMode: "create" | "reschedule";
  schedulingIntent: SchedulingIntent | null;
  freeSlots: Date[];
  calendarEvents: CalendarEvent[];
  meetingDuration: number;
  excludeEventId?: string;
  meetingAttendees: string[];
  onReply: () => void;
  onArchive: () => void;
  onSchedule: () => void;
  onSnooze: () => void;
  onCloseAvailability: () => void;
  onSelectSlot: (slot: Date) => void;
  onRescheduleMeeting: () => void;
  onCancelMeeting: () => void;
  aiProvider: AiProvider;
  onSuggestedAction: (action: SuggestedAction) => void;
  threadCommitments?: CommitmentItem[];
  onConfirmCommitment?: (id: string) => void;
  onDismissCommitment?: (id: string) => void;
  onPreBrief?: () => void;
  preBriefSlot?: React.ReactNode;
}

function ShortcutButton({
  label,
  shortcut,
  icon: Icon,
  onClick,
}: {
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="dark-utility" size="xs" onClick={onClick}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          {label}
          <KbdBadge className="ml-1 !bg-white/10 !text-white/70">{shortcut}</KbdBadge>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ThreadView({
  thread,
  modLabel,
  linkedMeeting,
  linkedEvent,
  rsvpSummary,
  availabilityOpen,
  availabilityMode,
  schedulingIntent,
  freeSlots,
  calendarEvents,
  meetingDuration,
  excludeEventId,
  meetingAttendees,
  onReply,
  onArchive,
  onSchedule,
  onSnooze,
  onCloseAvailability,
  onSelectSlot,
  onRescheduleMeeting,
  onCancelMeeting,
  aiProvider,
  onSuggestedAction,
  threadCommitments = [],
  onConfirmCommitment,
  onDismissCommitment,
  onPreBrief,
  preBriefSlot,
}: ThreadViewProps) {
  if (!thread) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="type-display-md text-ink" style={{ fontSize: 24 }}>
          Pick a thread.
        </p>
        <p className="type-caption text-ink-muted-48 inline-flex items-center justify-center gap-2 flex-wrap">
          <KbdSequence keys={["J", "K"]} /> to navigate ·{" "}
          <KbdBadge>{modLabel}K</KbdBadge> for the command palette
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      {/* Thread action toolbar — dark utility buttons */}
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <ShortcutButton label="Reply" shortcut="R" icon={Reply} onClick={onReply} />
        <ShortcutButton label="Archive" shortcut="E" icon={Archive} onClick={onArchive} />
        <ShortcutButton
          label={linkedMeeting ? "Reschedule" : "Meeting"}
          shortcut="M"
          icon={Calendar}
          onClick={onSchedule}
        />
        <ShortcutButton label="Snooze" shortcut="S" icon={Clock} onClick={onSnooze} />
        {onPreBrief && (
          <ShortcutButton label="Pre-brief" shortcut="B" icon={FileText} onClick={onPreBrief} />
        )}
      </div>

      {preBriefSlot}

      {threadCommitments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2">
          {threadCommitments.map((c) => (
            <span
              key={c.id}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                c.status === "pending_confirm"
                  ? "border border-amber-300 bg-amber-50 text-amber-900"
                  : "border border-primary/30 bg-primary/5 text-foreground"
              }`}
            >
              {c.status === "pending_confirm" ? "Possible: " : ""}
              {c.text}
              {c.status === "pending_confirm" && onConfirmCommitment && onDismissCommitment && (
                <>
                  <button type="button" className="font-semibold underline" onClick={() => onConfirmCommitment(c.id)}>
                    Yes
                  </button>
                  <button type="button" className="text-muted-foreground underline" onClick={() => onDismissCommitment(c.id)}>
                    No
                  </button>
                </>
              )}
            </span>
          ))}
        </div>
      )}

      {linkedMeeting && !availabilityOpen && (
        <MeetingBanner
          meeting={linkedMeeting}
          event={linkedEvent}
          rsvp={rsvpSummary}
          onReschedule={onRescheduleMeeting}
          onCancel={onCancelMeeting}
        />
      )}

      <InlineAvailabilityPicker
        open={availabilityOpen}
        mode={availabilityMode}
        schedulingIntent={schedulingIntent}
        freeSlots={freeSlots}
        calendarEvents={calendarEvents}
        durationMinutes={meetingDuration}
        excludeEventId={excludeEventId}
        attendees={meetingAttendees}
        onClose={onCloseAvailability}
        onSelectSlot={onSelectSlot}
      />

      <div className="border-b border-hairline px-6 py-5">
        <h1 className="type-tagline text-ink leading-snug">{thread.subject}</h1>
        <p className="mt-2 type-caption text-ink-muted-48">
          {thread.participants.map((p) => p.name).join(", ")}
        </p>
      </div>

      <ThreadSummaryBox
        thread={thread}
        provider={aiProvider}
        onAction={onSuggestedAction}
      />

      <ScrollArea className="flex-1">
        <div className="space-y-8 p-6">
          {thread.messages.map((message) => (
            <article key={message.id} className="flex gap-4">
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-parchment flex items-center justify-center type-caption-strong text-ink-muted-80">
                {message.from.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="type-body-strong text-ink">{message.from.name}</span>
                  <span className="type-caption text-ink-muted-48">
                    {message.from.email}
                  </span>
                  <span className="type-fine text-ink-muted-48">
                    · {formatRelativeTime(message.timestamp)}
                  </span>
                </div>
                <div className="mt-3">
                  {message.bodyHtml ? (
                    <EmailHtmlFrame html={message.bodyHtml} />
                  ) : (
                    <p className="whitespace-pre-wrap type-body text-ink">
                      {message.body}
                    </p>
                  )}
                </div>
                {message.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.attachments.map((att) => (
                      <span
                        key={att.id}
                        className="btn-pearl-capsule"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                      >
                        {att.filename}
                      </span>
                    ))}
                  </div>
                )}
                <Separator className="mt-8" />
              </div>
            </article>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
