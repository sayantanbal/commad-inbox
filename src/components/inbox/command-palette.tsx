"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { formatShortcut, getPaletteShortcuts } from "@/lib/shortcuts";
import type { ShortcutContext } from "@/lib/types";

const contextLabels: Record<ShortcutContext, string> = {
  global: "Navigation",
  list: "Mail actions",
  thread: "Thread actions",
  composer: "Composer",
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
  onAction: (action: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  isMac,
  onAction,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const grouped = getPaletteShortcuts().reduce<
    Record<ShortcutContext, ReturnType<typeof getPaletteShortcuts>>
  >(
    (acc, shortcut) => {
      acc[shortcut.context].push(shortcut);
      return acc;
    },
    { global: [], list: [], thread: [], composer: [] }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] overflow-hidden p-0">
        <Command className="bg-canvas" shouldFilter>
          {/* Input row — 52px, hairline at bottom only */}
          <div className="flex h-[52px] items-center gap-3 border-b border-hairline px-5">
            <Search
              className="h-4 w-4 text-ink-muted-48 flex-shrink-0"
              strokeWidth={1.75}
            />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="h-full w-full bg-transparent text-[17px] font-normal text-ink outline-none placeholder:text-ink-muted-48"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-10 text-center type-caption text-ink-muted-48">
              No commands match that. Try a different verb.
            </Command.Empty>

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
                      onSelect={() => {
                        onAction(shortcut.action);
                        onOpenChange(false);
                      }}
                      className="group flex h-11 cursor-pointer items-center justify-between rounded-[8px] px-3 type-caption text-ink aria-selected:bg-primary aria-selected:text-on-primary"
                    >
                      <span>{shortcut.description}</span>
                      <KeyChips
                        label={formatShortcut(shortcut, isMac)}
                      />
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

/**
 * Render a formatted shortcut string ("⌘ K" or "G I") as one or more
 * KbdBadge chips. We split on whitespace / "+" so things like "G I" become
 * two chips and "⌘+K" becomes a single chip "⌘K".
 */
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
