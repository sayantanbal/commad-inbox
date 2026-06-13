"use client";

import { Calendar, Inbox, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type PrimaryView = "brief" | "inbox" | "calendar";

interface PrimaryNavProps {
  active: PrimaryView;
  onChange: (view: PrimaryView) => void;
  inboxCount?: number;
}

const items: Array<{
  id: PrimaryView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "brief", label: "Daily brief", icon: Sun },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

export function PrimaryNav({ active, onChange, inboxCount }: PrimaryNavProps) {
  return (
    <nav
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card/50 py-3 md:w-44 md:items-stretch md:px-2"
      aria-label="Primary"
    >
      {items.map(({ id, label, icon: Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[10px] font-medium transition-colors md:flex-row md:gap-2 md:px-3 md:text-xs",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{label.split(" ")[0]}</span>
            {id === "inbox" && inboxCount != null && inboxCount > 0 && !selected && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground md:static md:ml-auto">
                {inboxCount > 9 ? "9+" : inboxCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
