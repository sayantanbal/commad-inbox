"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { formatShortcut, getShortcutsByContext } from "@/lib/shortcuts";
import type { ShortcutContext } from "@/lib/types";

const contextLabels: Record<ShortcutContext, string> = {
  global: "Global",
  list: "Mail list",
  thread: "Thread",
  composer: "Composer",
};

interface ShortcutCheatsheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
}

export function ShortcutCheatsheet({
  open,
  onOpenChange,
  isMac,
}: ShortcutCheatsheetProps) {
  const contexts: ShortcutContext[] = ["global", "list", "thread", "composer"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0">
        <DialogHeader className="border-b border-hairline px-6 py-4">
          <DialogTitle className="type-tagline text-ink">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          {contexts.map((context) => {
            const shortcuts = getShortcutsByContext(context).filter(
              (s) => s.context === context
            );
            if (shortcuts.length === 0) return null;

            return (
              <div key={context}>
                <h3
                  className="type-caption-strong text-ink-muted-48 uppercase mb-3"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {contextLabels[context]}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((shortcut) => {
                    const tokens = formatShortcut(shortcut, isMac)
                      .split(/\s+/)
                      .filter(Boolean);
                    return (
                      <div
                        key={`${context}-${shortcut.action}`}
                        className="flex items-center justify-between rounded-[8px] px-3 py-2 type-caption text-ink hover:bg-pearl transition-colors"
                      >
                        <span>{shortcut.description}</span>
                        <span className="flex items-center gap-1">
                          {tokens.map((t, i) => (
                            <KbdBadge key={`${t}-${i}`}>{t}</KbdBadge>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
