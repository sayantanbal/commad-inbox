"use client";

import { useState } from "react";
import type { DynamicToolUIPart } from "ai";
import { AgentToolApproval } from "@/components/inbox/agent-tool-approval";
import { TooltipProvider } from "@/components/ui/tooltip";

const SEND_EMAIL_PART: DynamicToolUIPart = {
  type: "dynamic-tool",
  toolName: "send_email",
  toolCallId: "e2e-send-email-1",
  state: "approval-requested",
  input: {
    to: "friend@corsair.dev",
    subject: "Looking forward to Thursday",
    body: "Hi — confirming our 9 AM meeting next Thursday. Talk soon!",
  },
  approval: { id: "e2e-approval-send-1" },
};

const CALENDAR_PART: DynamicToolUIPart = {
  type: "dynamic-tool",
  toolName: "create_calendar_invite",
  toolCallId: "e2e-calendar-1",
  state: "approval-requested",
  input: {
    summary: "Coffee with friend",
    start: "2026-06-26T09:00:00.000Z",
    durationMinutes: 30,
    attendees: ["friend@corsair.dev"],
  },
  approval: { id: "e2e-approval-calendar-1" },
};

export function AgentApprovalHarness() {
  const [sendResult, setSendResult] = useState<"pending" | "approved" | "denied">("pending");
  const [calendarResult, setCalendarResult] = useState<"pending" | "approved" | "denied">(
    "pending"
  );

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 bg-background p-6">
        <header>
          <h1 className="type-display-md text-ink">Agent approval harness</h1>
          <p className="mt-2 type-caption text-ink-muted-48">
            E2E test page — exercises pause/resume on approval cards without Google auth.
          </p>
        </header>

        <section aria-label="Send email approval">
          <h2 className="type-body-strong mb-3 text-ink">send_email</h2>
          {sendResult === "pending" ? (
            <AgentToolApproval
              part={SEND_EMAIL_PART}
              onApprove={() => setSendResult("approved")}
              onDeny={() => setSendResult("denied")}
            />
          ) : (
            <p data-testid="send-email-result" className="type-body text-ink">
              {sendResult}
            </p>
          )}
        </section>

        <section aria-label="Calendar invite approval">
          <h2 className="type-body-strong mb-3 text-ink">create_calendar_invite</h2>
          {calendarResult === "pending" ? (
            <AgentToolApproval
              part={CALENDAR_PART}
              onApprove={() => setCalendarResult("approved")}
              onDeny={() => setCalendarResult("denied")}
            />
          ) : (
            <p data-testid="calendar-result" className="type-body text-ink">
              {calendarResult}
            </p>
          )}
        </section>
      </div>
    </TooltipProvider>
  );
}
