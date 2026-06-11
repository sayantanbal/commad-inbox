"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatShortcut, SHORTCUTS } from "@/lib/shortcuts";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
  onAction: (action: string) => void;
}

export function CommandPalette({ open, onOpenChange, isMac, onAction }: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <Command className="bg-popover" shouldFilter>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command..."
            className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No commands found.
            </Command.Empty>
            <Command.Group heading="Actions">
              {SHORTCUTS.map((shortcut) => (
                <Command.Item
                  key={shortcut.action}
                  value={`${shortcut.description} ${shortcut.action}`}
                  onSelect={() => {
                    onAction(shortcut.action);
                    onOpenChange(false);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm aria-selected:bg-accent"
                >
                  <span>{shortcut.description}</span>
                  <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {formatShortcut(shortcut, isMac)}
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
