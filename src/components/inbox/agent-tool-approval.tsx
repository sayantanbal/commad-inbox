"use client";

import { format } from "date-fns";
import { Calendar, Mail } from "lucide-react";
import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import { Button } from "@/components/ui/button";

/*
  Spec — Tool Approval Card:
    • parchment bg, rounded-lg (18px), 1px primary border, 16px padding
    • caption-strong ALLCAPS primary "PENDING APPROVAL"
    • body-strong action description
    • nested canvas-bordered preview block (caption 14px)
    • CTAs: button-primary "Approve & Send" + button-dark-utility "Edit first"
      + text-link "Reject"
*/

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

/**
 * Shell used by every variant — owns the spec's structural decisions
 * (parchment bg + primary border, label, action title, preview block, CTAs).
 */
function ApprovalCard({
  icon,
  title,
  approveLabel,
  preview,
  approvalId,
  onApprove,
  onDeny,
}: {
  icon: React.ReactNode;
  title: string;
  approveLabel: string;
  preview: React.ReactNode;
  approvalId: string;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  return (
    <div
      className="mr-2 rounded-[18px] bg-parchment p-4 border"
      style={{ borderColor: "var(--color-primary)" }}
    >
      <div
        className="flex items-center gap-2 type-caption-strong text-primary uppercase"
        style={{ letterSpacing: "0.06em" }}
      >
        {icon}
        Pending approval
      </div>
      <p className="mt-2 type-body-strong text-ink">{title}</p>

      <div className="mt-3 rounded-[8px] border border-hairline bg-canvas p-3 type-caption text-ink">
        {preview}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={() => onApprove(approvalId)}>
          {approveLabel}
        </Button>
        <Button size="sm" variant="dark-utility">
          Edit first
        </Button>
        <button
          type="button"
          onClick={() => onDeny(approvalId)}
          className="ml-auto type-caption text-ink-muted-48 hover:text-ink transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
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
    <ApprovalCard
      icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.75} />}
      title={`Send email to ${to[0] ?? "recipient"}`}
      approveLabel="Approve & send"
      approvalId={approvalId}
      onApprove={onApprove}
      onDeny={onDeny}
      preview={
        <div className="space-y-2">
          <div className="grid grid-cols-[3rem_1fr] gap-x-3 gap-y-1.5">
            <span className="type-fine text-ink-muted-48">To</span>
            <span className="type-caption text-ink">{to.join(", ") || "—"}</span>
            <span className="type-fine text-ink-muted-48">Subject</span>
            <span className="type-caption text-ink">{subject || "—"}</span>
          </div>
          <div className="border-t border-hairline pt-2">
            <p className="type-fine text-ink-muted-48 mb-1">Message</p>
            <p className="type-caption text-ink-muted-80 whitespace-pre-wrap">
              {body || "—"}
            </p>
          </div>
        </div>
      }
    />
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
  const description =
    typeof input.description === "string" ? input.description : "";

  const whenLabel =
    start && !Number.isNaN(start.getTime())
      ? format(start, "EEE, MMM d · h:mm a")
      : startRaw || "—";

  return (
    <ApprovalCard
      icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />}
      title={`Send invite — ${summary}`}
      approveLabel="Approve & send invite"
      approvalId={approvalId}
      onApprove={onApprove}
      onDeny={onDeny}
      preview={
        <div className="space-y-2">
          <div className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5">
            <span className="type-fine text-ink-muted-48">Title</span>
            <span className="type-caption text-ink">{summary}</span>
            <span className="type-fine text-ink-muted-48">When</span>
            <span className="type-caption text-ink">
              {whenLabel}
              {duration ? ` · ${duration} min` : ""}
            </span>
            <span className="type-fine text-ink-muted-48">Guests</span>
            <span className="type-caption text-ink">
              {attendees.join(", ") || "—"}
            </span>
          </div>
          {description && (
            <div className="border-t border-hairline pt-2">
              <p className="type-fine text-ink-muted-48 mb-1">Notes</p>
              <p className="type-caption text-ink-muted-80 whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}
          <p className="type-fine text-ink-muted-48 border-t border-hairline pt-2">
            AI · A Google Meet link will be added and attendees will be notified.
          </p>
        </div>
      }
    />
  );
}

export function AgentToolApproval({
  part,
  onApprove,
  onDeny,
}: AgentToolApprovalProps) {
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
    <ApprovalCard
      icon={null}
      title="Confirm action"
      approveLabel="Confirm"
      approvalId={approvalId}
      onApprove={onApprove}
      onDeny={onDeny}
      preview={
        <p className="type-caption text-ink-muted-80">
          The agent wants to run{" "}
          <span className="font-mono text-ink">{toolName}</span>.
        </p>
      }
    />
  );
}
