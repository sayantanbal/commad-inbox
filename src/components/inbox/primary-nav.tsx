"use client";

import Link from "next/link";
import {
  Archive,
  CalendarRange,
  CircleHelp,
  Clock,
  Heart,
  Inbox,
  KeyRound,
  ListChecks,
  Send,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KbdBadge } from "@/components/ui/kbd-badge";

export type PrimaryView = "brief" | "inbox" | "calendar";
export type MailboxView = "inbox" | "sent" | "snoozed" | "archive";

interface PrimaryNavProps {
  active: PrimaryView;
  mailboxView?: MailboxView;
  onChange: (view: PrimaryView) => void;
  onMailboxView?: (view: MailboxView) => void;
  inboxCount?: number;
  commitmentsOpen?: boolean;
  commitmentsView?: "commitments" | "waiting";
  onShortcut?: (action: string) => void;
  userEmail?: string | null;
  userName?: string | null;
}

type NavRow =
  | {
      kind: "item";
      id: string;
      label: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
      keys?: string[];
      onSelect: () => void;
      isActive?: boolean;
      badge?: number;
    }
  | {
      kind: "link";
      id: string;
      label: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
      keys?: string[];
      href: string;
    };

export function PrimaryNav({
  active,
  mailboxView = "inbox",
  onChange,
  onMailboxView,
  inboxCount,
  commitmentsOpen = false,
  commitmentsView = "commitments",
  onShortcut,
  userEmail,
  userName,
}: PrimaryNavProps) {
  /* ── MAILBOX ── */
  const mailbox: NavRow[] = [
    {
      kind: "item",
      id: "inbox",
      label: "Inbox",
      icon: Inbox,
      keys: ["G", "I"],
      onSelect: () => {
        onChange("inbox");
        onMailboxView?.("inbox");
      },
      isActive: active === "inbox" && mailboxView === "inbox" && !commitmentsOpen,
      badge: inboxCount,
    },
    {
      kind: "item",
      id: "sent",
      label: "Sent",
      icon: Send,
      onSelect: () => {
        onChange("inbox");
        onMailboxView?.("sent");
      },
      isActive: active === "inbox" && mailboxView === "sent" && !commitmentsOpen,
    },
    {
      kind: "item",
      id: "snoozed",
      label: "Snoozed",
      icon: Clock,
      keys: ["G", "S"],
      onSelect: () => {
        onChange("inbox");
        onMailboxView?.("snoozed");
      },
      isActive: active === "inbox" && mailboxView === "snoozed" && !commitmentsOpen,
    },
    {
      kind: "item",
      id: "archive",
      label: "Archive",
      icon: Archive,
      onSelect: () => {
        onChange("inbox");
        onMailboxView?.("archive");
      },
      isActive: active === "inbox" && mailboxView === "archive" && !commitmentsOpen,
    },
    {
      kind: "item",
      id: "calendar",
      label: "Calendar",
      icon: CalendarRange,
      keys: ["G", "C"],
      onSelect: () => onChange("calendar"),
      isActive: active === "calendar",
    },
  ];

  /* ── WORKFLOW ── */
  const workflow: NavRow[] = [
    {
      kind: "item",
      id: "commitments",
      label: "Commitments",
      icon: ListChecks,
      keys: ["G", "T"],
      onSelect: () => onShortcut?.("nav-commitments"),
      isActive: commitmentsOpen && commitmentsView === "commitments",
    },
    {
      kind: "item",
      id: "waiting",
      label: "Waiting For",
      icon: Clock,
      keys: ["G", "W"],
      onSelect: () => onShortcut?.("nav-waiting"),
      isActive: commitmentsOpen && commitmentsView === "waiting",
    },
    {
      kind: "item",
      id: "brief",
      label: "Daily Brief",
      icon: Sun,
      keys: ["G", "B"],
      onSelect: () => onChange("brief"),
      isActive: active === "brief",
    },
  ];

  /* ── PEOPLE ── */
  const people: NavRow[] = [
    {
      kind: "link",
      id: "people",
      label: "Relationship Health",
      icon: Heart,
      href: "/people",
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="hidden w-[220px] shrink-0 flex-col border-r border-hairline bg-parchment md:flex"
    >
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavSection title="Mailbox" rows={mailbox} />
        <NavSection title="Workflow" rows={workflow} />
        <NavSection title="People" rows={people} />
      </div>

      {/* Footer */}
      <div className="border-t border-hairline px-3 py-3">
        <NavRowButton
          row={{
            kind: "item",
            id: "settings",
            label: "Settings",
            icon: Settings,
            onSelect: () => onShortcut?.("settings"),
          }}
        />
        <NavRowButton
          row={{
            kind: "item",
            id: "shortcuts",
            label: "Keyboard shortcuts",
            icon: KeyRound,
            keys: ["?"],
            onSelect: () => onShortcut?.("shortcuts"),
          }}
        />
        <NavRowButton
          row={{
            kind: "item",
            id: "help",
            label: "Help",
            icon: CircleHelp,
            onSelect: () => onShortcut?.("help"),
          }}
        />
        <div className="mt-3 flex items-center gap-2 rounded-[8px] px-3 py-2">
          <div className="h-6 w-6 flex-shrink-0 rounded-full bg-chip-translucent flex items-center justify-center type-fine text-ink-muted-80">
            {(userName?.[0] ?? userEmail?.[0] ?? "U").toUpperCase()}
          </div>
          <span className="type-caption text-ink-muted-80 truncate">
            {userName ?? userEmail ?? "Account"}
          </span>
        </div>
      </div>
    </nav>
  );
}

function NavSection({ title, rows }: { title: string; rows: NavRow[] }) {
  return (
    <div className="mt-6 first:mt-0">
      <p
        className="type-caption-strong text-ink-muted-48 uppercase px-3 mb-2"
        style={{ letterSpacing: "0.06em" }}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <li key={row.id}>
            <NavRowButton row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavRowButton({ row }: { row: NavRow }) {
  const Icon = row.icon;
  const active = row.kind === "item" && row.isActive;
  const className = cn(
    "group flex h-9 w-full items-center gap-2 rounded-[8px] px-3 transition-colors",
    "text-[14px] font-semibold tracking-[-0.224px]",
    active
      ? "bg-[rgba(0,102,204,0.08)] text-primary"
      : "text-ink-muted-80 hover:bg-pearl hover:text-ink"
  );

  const inner = (
    <>
      <Icon
        className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "text-ink-muted-48 group-hover:text-ink")}
        strokeWidth={1.75}
      />
      <span className="flex-1 truncate text-left">{row.label}</span>
      {row.kind === "item" && row.badge != null && row.badge > 0 && (
        <span
          className="rounded-full bg-primary text-on-primary type-fine px-1.5 min-w-[18px] h-[18px] flex items-center justify-center"
          style={{ letterSpacing: 0 }}
        >
          {row.badge > 99 ? "99+" : row.badge}
        </span>
      )}
      {row.keys && row.keys.length > 0 && (
        <span className="flex items-center gap-1">
          {row.keys.map((k, i) => (
            <KbdBadge key={`${k}-${i}`}>{k}</KbdBadge>
          ))}
        </span>
      )}
    </>
  );

  if (row.kind === "link") {
    return (
      <Link href={row.href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={row.onSelect} className={className}>
      {inner}
    </button>
  );
}
