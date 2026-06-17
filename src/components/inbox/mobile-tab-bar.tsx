"use client";

import { Calendar, Command, Inbox, MessageSquare, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileTab = "brief" | "inbox" | "calendar" | "agent";

interface MobileTabBarProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const tabs: Array<{ id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }> }> =
  [
    { id: "brief", label: "Brief", icon: Sun },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "agent", label: "Agent", icon: MessageSquare },
  ];

export function MobileTabBar({ active, onChange }: MobileTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors min-h-11",
              active === id ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

interface MobileCommandFabProps {
  modLabel: string;
  onOpenPalette: () => void;
}

export function MobileCommandFab({ modLabel, onOpenPalette }: MobileCommandFabProps) {
  return (
    <button
      type="button"
      aria-label="Open command palette"
      onClick={onOpenPalette}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 min-h-11 min-w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
    >
      <Command className="h-5 w-5" />
      <span className="sr-only">{modLabel}K commands</span>
    </button>
  );
}
