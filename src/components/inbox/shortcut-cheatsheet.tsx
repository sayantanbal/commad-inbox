"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatShortcut, getShortcutsByContext } from "@/lib/shortcuts";
import type { ShortcutContext } from "@/lib/types";

const contextLabels: Record<ShortcutContext, string> = {
  global: "Global",
  list: "List",
  thread: "Thread",
  composer: "Composer",
};

interface ShortcutCheatsheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
}

export function ShortcutCheatsheet({ open, onOpenChange, isMac }: ShortcutCheatsheetProps) {
  const contexts: ShortcutContext[] = ["global", "list", "thread", "composer"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {contexts.map((context) => {
            const shortcuts = getShortcutsByContext(context).filter((s) => s.context === context);
            if (shortcuts.length === 0) return null;

            return (
              <div key={context}>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {contextLabels[context]}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={`${context}-${shortcut.action}`}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                    >
                      <span>{shortcut.description}</span>
                      <kbd className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {formatShortcut(shortcut, isMac)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
