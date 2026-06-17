"use client";

import Link from "next/link";
import {
  Archive,
  Clock,
  Heart,
  Inbox,
  ListChecks,
  Send,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MailboxView } from "@/components/inbox/primary-nav";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  mailboxView: MailboxView;
  commitmentsOpen: boolean;
  commitmentsView: "commitments" | "waiting";
  onMailboxView: (view: MailboxView) => void;
  onOpenCommitments: (view: "commitments" | "waiting") => void;
  onOpenBrief: () => void;
  onOpenSettings: () => void;
}

type DrawerItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onSelect: () => void;
  active?: boolean;
};

export function MobileNavDrawer({
  open,
  onClose,
  mailboxView,
  commitmentsOpen,
  commitmentsView,
  onMailboxView,
  onOpenCommitments,
  onOpenBrief,
  onOpenSettings,
}: MobileNavDrawerProps) {
  if (!open) return null;

  const mailboxes: DrawerItem[] = [
    {
      id: "inbox",
      label: "Inbox",
      icon: Inbox,
      onSelect: () => onMailboxView("inbox"),
      active: !commitmentsOpen && mailboxView === "inbox",
    },
    {
      id: "sent",
      label: "Sent",
      icon: Send,
      onSelect: () => onMailboxView("sent"),
      active: !commitmentsOpen && mailboxView === "sent",
    },
    {
      id: "snoozed",
      label: "Snoozed",
      icon: Clock,
      onSelect: () => onMailboxView("snoozed"),
      active: !commitmentsOpen && mailboxView === "snoozed",
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      onSelect: () => onMailboxView("archive"),
      active: !commitmentsOpen && mailboxView === "archive",
    },
  ];

  const workflow: DrawerItem[] = [
    {
      id: "brief",
      label: "Daily Brief",
      icon: Sun,
      onSelect: onOpenBrief,
    },
    {
      id: "commitments",
      label: "Commitments",
      icon: ListChecks,
      onSelect: () => onOpenCommitments("commitments"),
      active: commitmentsOpen && commitmentsView === "commitments",
    },
    {
      id: "waiting",
      label: "Waiting For",
      icon: Clock,
      onSelect: () => onOpenCommitments("waiting"),
      active: commitmentsOpen && commitmentsView === "waiting",
    },
    {
      id: "people",
      label: "People",
      icon: Heart,
      onSelect: () => undefined,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onSelect: onOpenSettings,
    },
  ];

  const select = (item: DrawerItem) => {
    item.onSelect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-hairline bg-canvas shadow-xl">
        <div className="flex h-11 items-center justify-between border-b border-hairline px-4">
          <span className="type-body-strong text-ink">Navigate</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <DrawerSection title="Mailboxes" items={mailboxes} onSelect={select} />
          <DrawerSection
            title="Workflow"
            items={workflow}
            onSelect={(item) => {
              if (item.id === "people") {
                onClose();
                return;
              }
              select(item);
            }}
            renderItem={(item) =>
              item.id === "people" ? (
                <Link
                  key={item.id}
                  href="/people"
                  onClick={onClose}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 type-caption text-ink hover:bg-parchment"
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              ) : (
                <DrawerButton key={item.id} item={item} onSelect={select} />
              )
            }
          />
        </nav>
      </aside>
    </div>
  );
}

function DrawerSection({
  title,
  items,
  onSelect,
  renderItem,
}: {
  title: string;
  items: DrawerItem[];
  onSelect: (item: DrawerItem) => void;
  renderItem?: (item: DrawerItem) => React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className="type-caption-strong mb-2 px-3 text-ink-muted-48 uppercase tracking-[0.06em]">
        {title}
      </p>
      <div className="flex flex-col gap-1">
        {items.map((item) =>
          renderItem ? renderItem(item) : <DrawerButton key={item.id} item={item} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}

function DrawerButton({
  item,
  onSelect,
}: {
  item: DrawerItem;
  onSelect: (item: DrawerItem) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 type-caption text-ink transition-colors",
        item.active ? "bg-primary text-on-primary" : "hover:bg-parchment"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {item.label}
    </button>
  );
}
