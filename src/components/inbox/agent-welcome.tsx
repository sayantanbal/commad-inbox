"use client";

import { CalendarRange, Inbox, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentWelcomeProps {
  onOpenInbox: () => void;
  onOpenCalendar: () => void;
}

export function AgentWelcome({ onOpenInbox, onOpenCalendar }: AgentWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-parchment px-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,102,204,0.10)] text-primary">
        <Sparkles className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="mt-6 type-display-sm text-ink">Your agent is ready</h2>
      <p className="mt-3 max-w-md type-body text-ink-muted-48">
        Send mail, schedule meetings, and manage your inbox from the agent panel. Use{" "}
        <span className="font-mono text-ink-muted-80">@</span> to mention contacts.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={onOpenInbox}>
          <Inbox className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Open inbox
        </Button>
        <Button variant="outline" onClick={onOpenCalendar}>
          <CalendarRange className="mr-2 h-4 w-4" strokeWidth={1.75} />
          Open calendar
        </Button>
      </div>
    </div>
  );
}
