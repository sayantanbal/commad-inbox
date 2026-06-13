"use client";

import { format } from "date-fns";
import { Calendar, Check, Mail, X } from "lucide-react";
import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import { Button } from "@/components/ui/button";

type ApprovableToolPart = ToolUIPart | DynamicToolUIPart;

interface AgentToolApprovalProps {
  part: ApprovableToolPart;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

function asStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function SendEmailApproval({
  input,
  onApprove,
  onDeny,
  approvalId,
}: {
  input: Record<string, unknown>;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  approvalId: string;
}) {
  const to = asStringArray(input.to);
  const subject = typeof input.subject === "string" ? input.subject : "";
  const body = typeof input.body === "string" ? input.body : "";

  return (
    <div className="mr-2 space-y-3 rounded-lg border border-border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <p className="font-medium">Review email before sending</p>
      </div>

      <div className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs">
        <div className="grid grid-cols-[3rem_1fr] gap-x-2 gap-y-1.5">
          <span className="text-muted-foreground">To</span>
          <span className="font-medium text-foreground">{to.join(", ") || "—"}</span>
          <span className="text-muted-foreground">Subject</span>
          <span className="font-medium text-foreground">{subject || "—"}</span>
        </div>
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-muted-foreground">Message</p>
          <p className="whitespace-pre-wrap text-foreground/90">{body || "—"}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onApprove(approvalId)}>
          <Check className="h-3.5 w-3.5" />
          Send email
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => onDeny(approvalId)}>
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CalendarInviteApproval({
  input,
  onApprove,
  onDeny,
  approvalId,
}: {
  input: Record<string, unknown>;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  approvalId: string;
}) {
  const summary = typeof input.summary === "string" ? input.summary : "Meeting";
  const startRaw = typeof input.start === "string" ? input.start : "";
  const start = startRaw ? new Date(startRaw) : null;
  const duration =
    typeof input.durationMinutes === "number" ? input.durationMinutes : 30;
  const attendees = asStringArray(input.attendees);
  const description = typeof input.description === "string" ? input.description : "";

  const whenLabel =
    start && !Number.isNaN(start.getTime())
      ? format(start, "EEE, MMM d · h:mm a")
      : startRaw || "—";

  return (
    <div className="mr-2 space-y-3 rounded-lg border border-border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <p className="font-medium">Review calendar invite</p>
      </div>

      <div className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs">
        <div className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1.5">
          <span className="text-muted-foreground">Title</span>
          <span className="font-medium text-foreground">{summary}</span>
          <span className="text-muted-foreground">When</span>
          <span className="font-medium text-foreground">
            {whenLabel}
            {duration ? ` · ${duration} min` : ""}
          </span>
          <span className="text-muted-foreground">Guests</span>
          <span className="font-medium text-foreground">{attendees.join(", ") || "—"}</span>
        </div>
        {description ? (
          <div className="border-t border-border pt-2">
            <p className="mb-1 text-muted-foreground">Notes</p>
            <p className="whitespace-pre-wrap text-foreground/90">{description}</p>
          </div>
        ) : null}
        <p className="border-t border-border pt-2 text-muted-foreground">
          A Google Meet link will be added and attendees will be notified.
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onApprove(approvalId)}>
          <Check className="h-3.5 w-3.5" />
          Send invite
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => onDeny(approvalId)}>
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function AgentToolApproval({ part, onApprove, onDeny }: AgentToolApprovalProps) {
  const input = (part.input as Record<string, unknown> | undefined) ?? {};
  const toolName = getToolName(part);
  const approvalId = part.approval?.id;

  if (!approvalId) return null;

  if (toolName === "send_email") {
    return (
      <SendEmailApproval
        input={input}
        approvalId={approvalId}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );
  }

  if (toolName === "create_calendar_invite") {
    return (
      <CalendarInviteApproval
        input={input}
        approvalId={approvalId}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );
  }

  return (
    <div className="mr-2 space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
      <p className="font-medium">Confirm action</p>
      <p className="text-xs text-muted-foreground">
        The agent wants to run <span className="font-mono text-foreground">{toolName}</span>.
      </p>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onApprove(approvalId)}>
          <Check className="h-3.5 w-3.5" />
          Confirm
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => onDeny(approvalId)}>
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
