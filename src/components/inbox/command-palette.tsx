"use client";

import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { formatShortcut, getPaletteShortcuts } from "@/lib/shortcuts";
import {
  filterPaletteNavCommands,
  searchThreadsForPalette,
  type PaletteNavCommand,
} from "@/lib/inbox/palette-search";
import { readRecentThreads, type RecentThread } from "@/lib/inbox/palette-recent";
import { threadDisplaySender } from "@/lib/inbox/palette-search";
import type { ShortcutContext } from "@/lib/types";
import type { Thread } from "@/lib/types";

const contextLabels: Record<ShortcutContext, string> = {
  global: "Shortcuts",
  list: "Mail actions",
  thread: "Thread actions",
  composer: "Composer",
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
  threads: Thread[];
  onAction: (action: string, payload?: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  isMac,
  threads,
  onAction,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState<RecentThread[]>([]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    setRecent(readRecentThreads());
  }, [open]);

  const navCommands = useMemo(() => filterPaletteNavCommands(search), [search]);
  const threadMatches = useMemo(
    () => searchThreadsForPalette(threads, search),
    [search, threads]
  );
  const recentVisible = useMemo(() => {
    if (search.trim()) return [];
    return recent
      .map((item) => threads.find((thread) => thread.id === item.id) ?? item)
      .filter(Boolean);
  }, [recent, search, threads]);

  const grouped = getPaletteShortcuts().reduce<
    Record<ShortcutContext, ReturnType<typeof getPaletteShortcuts>>
  >(
    (acc, shortcut) => {
      acc[shortcut.context].push(shortcut);
      return acc;
    },
    { global: [], list: [], thread: [], composer: [] }
  );

  const run = (action: string, payload?: string) => {
    onAction(action, payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] overflow-hidden p-0">
        <Command className="bg-canvas" shouldFilter={false}>
          <div className="flex h-[52px] items-center gap-3 border-b border-hairline px-5">
            <Search
              className="h-4 w-4 text-ink-muted-48 flex-shrink-0"
              strokeWidth={1.75}
            />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Jump to mailbox, thread, or command…"
              className="h-full w-full bg-transparent text-[17px] font-normal text-ink outline-none placeholder:text-ink-muted-48"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-10 text-center type-caption text-ink-muted-48">
              No matches. Try “sent”, “archive”, or a sender name.
            </Command.Empty>

            {recentVisible.length > 0 && (
              <Command.Group
                heading="Recent"
                className="[&_[cmdk-group-heading]]:type-caption-strong [&_[cmdk-group-heading]]:text-ink-muted-48 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {recentVisible.map((item) => {
                  const id = "id" in item ? item.id : "";
                  const subject = "subject" in item ? item.subject : "";
                  const from =
                    "participants" in item
                      ? threadDisplaySender(item)
                      : "from" in item
                        ? item.from
                        : "";
                  return (
                    <Command.Item
                      key={`recent-${id}`}
                      value={`recent ${subject} ${from}`}
                      onSelect={() => run("openThread", id)}
                      className="group flex h-11 cursor-pointer items-center justify-between rounded-[8px] px-3 type-caption text-ink aria-selected:bg-primary aria-selected:text-on-primary"
                    >
                      <span className="truncate">
                        <span className="type-caption-strong">{subject || "Thread"}</span>
                        <span className="text-ink-muted-48"> · {from}</span>
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {threadMatches.length > 0 && (
              <Command.Group
                heading="Threads"
                className="[&_[cmdk-group-heading]]:type-caption-strong [&_[cmdk-group-heading]]:text-ink-muted-48 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {threadMatches.map((thread) => (
                  <Command.Item
                    key={`thread-${thread.id}`}
                    value={`thread ${thread.subject} ${threadDisplaySender(thread)}`}
                    onSelect={() => run("openThread", thread.id)}
                    className="group flex h-11 cursor-pointer items-center justify-between rounded-[8px] px-3 type-caption text-ink aria-selected:bg-primary aria-selected:text-on-primary"
                  >
                    <span className="truncate">
                      <span className="type-caption-strong">{thread.subject}</span>
                      <span className="text-ink-muted-48"> · {threadDisplaySender(thread)}</span>
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <NavGroup commands={navCommands.filter((c) => c.group === "Navigate")} onSelect={run} />
            <NavGroup commands={navCommands.filter((c) => c.group === "Actions")} onSelect={run} />

            {(Object.keys(grouped) as ShortcutContext[]).map((context) => {
              const shortcuts = grouped[context];
              if (shortcuts.length === 0) return null;

              return (
                <Command.Group
                  key={context}
                  heading={contextLabels[context]}
                  className="[&_[cmdk-group-heading]]:type-caption-strong [&_[cmdk-group-heading]]:text-ink-muted-48 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {shortcuts.map((shortcut) => (
                    <Command.Item
                      key={shortcut.id}
                      value={`${shortcut.description} ${shortcut.action} ${context}`}
                      onSelect={() => run(shortcut.action)}
                      className="group flex h-11 cursor-pointer items-center justify-between rounded-[8px] px-3 type-caption text-ink aria-selected:bg-primary aria-selected:text-on-primary"
                    >
                      <span>{shortcut.description}</span>
                      <KeyChips label={formatShortcut(shortcut, isMac)} />
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function NavGroup({
  commands,
  onSelect,
}: {
  commands: PaletteNavCommand[];
  onSelect: (action: string) => void;
}) {
  if (commands.length === 0) return null;
  return (
    <Command.Group
      heading={commands[0]?.group ?? "Navigate"}
      className="[&_[cmdk-group-heading]]:type-caption-strong [&_[cmdk-group-heading]]:text-ink-muted-48 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
    >
      {commands.map((command) => (
        <Command.Item
          key={command.id}
          value={`${command.label} ${command.keywords}`}
          onSelect={() => onSelect(command.action)}
          className="group flex h-11 cursor-pointer items-center justify-between rounded-[8px] px-3 type-caption text-ink aria-selected:bg-primary aria-selected:text-on-primary"
        >
          <span>{command.label}</span>
        </Command.Item>
      ))}
    </Command.Group>
  );
}

function KeyChips({ label }: { label: string }) {
  const tokens = label
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return null;
  return (
    <span className="flex items-center gap-1 group-aria-selected:[&_.kbd-badge]:bg-white/15 group-aria-selected:[&_.kbd-badge]:text-on-primary">
      {tokens.map((t, i) => (
        <KbdBadge key={`${t}-${i}`}>{t}</KbdBadge>
      ))}
    </span>
  );
}
