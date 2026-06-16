"use client";

import { format } from "date-fns";
import { Calendar, Clock, Mail } from "lucide-react";
import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import { Button } from "@/components/ui/button";
import {
  AttachmentApprovalPreview,
  useAttachmentApprovalState,
} from "@/components/inbox/attachment-approval-preview";

type ApprovableToolPart = ToolUIPart | DynamicToolUIPart;

interface AgentToolApprovalProps {
  part: ApprovableToolPart;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
  onEdit?: (toolName: string, input: Record<string, unknown>) => void;
  shouldBridgeInviteToInbox?: (input: Record<string, unknown>) => boolean;
}

function asStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function ApprovalCard({
  icon,
  title,
  approveLabel,
  preview,
  approvalId,
  toolName,
  input,
  onApprove,
  onDeny,
  onEdit,
  approveDisabled,
  blockedBanner,
}: {
  icon: React.ReactNode;
  title: string;
  approveLabel: string;
  preview: React.ReactNode;
  approvalId: string;
  toolName: string;
  input: Record<string, unknown>;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onEdit?: (toolName: string, input: Record<string, unknown>) => void;
  approveDisabled?: boolean;
  blockedBanner?: string;
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

      {blockedBanner ? (
        <p className="mt-2 rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 type-caption text-destructive">
          {blockedBanner}
        </p>
      ) : null}

      <div className="mt-3 rounded-[8px] border border-hairline bg-canvas p-3 type-caption text-ink">
        {preview}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={() => onApprove(approvalId)} disabled={approveDisabled}>
          {approveLabel}
        </Button>
        {onEdit && (
          <Button size="sm" variant="dark-utility" onClick={() => onEdit(toolName, input)}>
            Edit first
          </Button>
        )}
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

function RecipientRows({ input }: { input: Record<string, unknown> }) {
  const to = asStringArray(input.to);
  const cc = asStringArray(input.cc);
  const bcc = asStringArray(input.bcc);
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-x-3 gap-y-1.5">
      <span className="type-fine text-ink-muted-48">To</span>
      <span className="type-caption text-ink">{to.join(", ") || "—"}</span>
      {cc.length > 0 && (
        <>
          <span className="type-fine text-ink-muted-48">Cc</span>
          <span className="type-caption text-ink">{cc.join(", ")}</span>
        </>
      )}
      {bcc.length > 0 && (
        <>
          <span className="type-fine text-ink-muted-48">Bcc</span>
          <span className="type-caption text-ink">{bcc.join(", ")}</span>
        </>
      )}
    </div>
  );
}

function SendEmailApproval({
  input,
  onApprove,
  onDeny,
  onEdit,
  approvalId,
}: {
  input: Record<string, unknown>;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onEdit?: (toolName: string, input: Record<string, unknown>) => void;
  approvalId: string;
}) {
  const to = asStringArray(input.to);
  const subject = typeof input.subject === "string" ? input.subject : "";
  const body = typeof input.body === "string" ? input.body : "";
  const attachmentIds = asStringArray(input.attachmentIds);
  const { blocked } = useAttachmentApprovalState(attachmentIds);

  return (
    <ApprovalCard
      icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.75} />}
      title={`Send email to ${to[0] ?? "recipient"}`}
      approveLabel="Approve & send"
      approvalId={approvalId}
      toolName="send_email"
      input={input}
      onApprove={onApprove}
      onDeny={onDeny}
      onEdit={onEdit}
      approveDisabled={blocked}
      blockedBanner={
        blocked
          ? "This exceeds Gmail's native attachment limit. Smart large-file handling is coming soon—this agent will compress, split, or route oversized files automatically."
          : undefined
      }
      preview={
        <div className="space-y-2">
          <RecipientRows input={input} />
          <div className="grid grid-cols-[3rem_1fr] gap-x-3 gap-y-1.5">
            <span className="type-fine text-ink-muted-48">Subject</span>
            <span className="type-caption text-ink">{subject || "—"}</span>
          </div>
          <div className="border-t border-hairline pt-2">
            <p className="type-fine text-ink-muted-48 mb-1">Message</p>
            <p className="type-caption text-ink-muted-80 whitespace-pre-wrap">{body || "—"}</p>
          </div>
          <AttachmentApprovalPreview attachmentIds={attachmentIds} />
        </div>
      }
    />
  );
}

function ScheduleSendApproval({
  input,
  onApprove,
  onDeny,
  onEdit,
  approvalId,
}: {
  input: Record<string, unknown>;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onEdit?: (toolName: string, input: Record<string, unknown>) => void;
  approvalId: string;
}) {
  const subject = typeof input.subject === "string" ? input.subject : "";
  const body = typeof input.body === "string" ? input.body : "";
  const sendAtRaw = typeof input.sendAt === "string" ? input.sendAt : "";
  const sendAt = sendAtRaw ? new Date(sendAtRaw) : null;
  const attachmentIds = asStringArray(input.attachmentIds);
  const { blocked } = useAttachmentApprovalState(attachmentIds);

  return (
    <ApprovalCard
      icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.75} />}
      title="Schedule email send"
      approveLabel="Approve & schedule"
      approvalId={approvalId}
      toolName="schedule_send"
      input={input}
      onApprove={onApprove}
      onDeny={onDeny}
      onEdit={onEdit}
      approveDisabled={blocked}
      blockedBanner={
        blocked
          ? "This exceeds Gmail's native attachment limit. Smart large-file handling is coming soon—this agent will compress, split, or route oversized files automatically."
          : undefined
      }
      preview={
        <div className="space-y-2">
          <RecipientRows input={input} />
          <div className="grid grid-cols-[3rem_1fr] gap-x-3 gap-y-1.5">
            <span className="type-fine text-ink-muted-48">When</span>
            <span className="type-caption text-ink">
              {sendAt && !Number.isNaN(sendAt.getTime())
                ? format(sendAt, "EEE, MMM d · h:mm a")
                : sendAtRaw || "—"}
            </span>
            <span className="type-fine text-ink-muted-48">Subject</span>
            <span className="type-caption text-ink">{subject || "—"}</span>
          </div>
          <div className="border-t border-hairline pt-2">
            <p className="type-caption text-ink-muted-80 whitespace-pre-wrap">{body || "—"}</p>
          </div>
          <AttachmentApprovalPreview attachmentIds={attachmentIds} />
        </div>
      }
    />
  );
}

function CalendarInviteApproval({
  input,
  onApprove,
  onDeny,
  onEdit,
  approvalId,
  shouldBridgeInviteToInbox,
}: {
  input: Record<string, unknown>;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onEdit?: (toolName: string, input: Record<string, unknown>) => void;
  approvalId: string;
  shouldBridgeInviteToInbox?: (input: Record<string, unknown>) => boolean;
}) {
  const useInboxFlow = shouldBridgeInviteToInbox?.(input) ?? false;
  const summary = typeof input.summary === "string" ? input.summary : "Meeting";
  const startRaw = typeof input.start === "string" ? input.start : "";
  const start = startRaw ? new Date(startRaw) : null;
  const duration = typeof input.durationMinutes === "number" ? input.durationMinutes : 30;
  const attendees = asStringArray(input.attendees);
  const description = typeof input.description === "string" ? input.description : "";

  const whenLabel =
    start && !Number.isNaN(start.getTime())
      ? format(start, "EEE, MMM d · h:mm a")
      : startRaw || "—";

  return (
    <ApprovalCard
      icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />}
      title={`Send invite — ${summary}`}
      approveLabel={useInboxFlow ? "Schedule in inbox" : "Approve & send invite"}
      approvalId={approvalId}
      toolName="create_calendar_invite"
      input={input}
      onApprove={
        useInboxFlow && onEdit
          ? () => {
              onDeny(approvalId);
              onEdit("create_calendar_invite", input);
            }
          : onApprove
      }
      onDeny={onDeny}
      onEdit={useInboxFlow ? undefined : onEdit}
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
            <span className="type-caption text-ink">{attendees.join(", ") || "—"}</span>
          </div>
          {description && (
            <div className="border-t border-hairline pt-2">
              <p className="type-caption text-ink-muted-80 whitespace-pre-wrap">{description}</p>
            </div>
          )}
        </div>
      }
    />
  );
}

export function AgentToolApproval({
  part,
  onApprove,
  onDeny,
  onEdit,
  shouldBridgeInviteToInbox,
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
        onEdit={onEdit}
      />
    );
  }

  if (toolName === "schedule_send") {
    return (
      <ScheduleSendApproval
        input={input}
        approvalId={approvalId}
        onApprove={onApprove}
        onDeny={onDeny}
        onEdit={onEdit}
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
        onEdit={onEdit}
        shouldBridgeInviteToInbox={shouldBridgeInviteToInbox}
      />
    );
  }

  return (
    <ApprovalCard
      icon={null}
      title="Confirm action"
      approveLabel="Confirm"
      approvalId={approvalId}
      toolName={toolName}
      input={input}
      onApprove={onApprove}
      onDeny={onDeny}
      onEdit={onEdit}
      preview={
        <p className="type-caption text-ink-muted-80">
          The agent wants to run <span className="font-mono text-ink">{toolName}</span>.
        </p>
      }
    />
  );
}
