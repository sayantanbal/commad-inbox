import type { Shortcut, ShortcutContext } from "./types";

export const SHORTCUTS: Shortcut[] = [
  { key: "j", context: "list", action: "nextThread", description: "Next thread" },
  { key: "k", context: "list", action: "prevThread", description: "Previous thread" },
  { key: "e", context: "thread", action: "archive", description: "Archive (move to Done)" },
  { key: "r", context: "thread", action: "reply", description: "Reply" },
  { key: "m", context: "thread", action: "meeting", description: "Schedule meeting" },
  { key: "s", context: "thread", action: "snooze", description: "Snooze" },
  { key: "/", context: "global", action: "search", description: "Semantic search" },
  { key: "/", shift: true, context: "global", action: "help", description: "Shortcut cheat sheet" },
  { key: "x", context: "list", action: "select", description: "Toggle multi-select" },
  { key: "k", mod: true, context: "global", action: "palette", description: "Command palette" },
  { key: "Enter", mod: true, context: "composer", action: "send", description: "Send email" },
  { key: "f", mod: true, shift: true, context: "global", action: "advancedSearch", description: "Advanced search" },
];

export function getModLabel(isMac: boolean): string {
  return isMac ? "⌘" : "Ctrl";
}

export function formatShortcut(shortcut: Shortcut, isMac: boolean): string {
  const parts: string[] = [];
  if (shortcut.mod) parts.push(getModLabel(isMac));
  if (shortcut.shift) parts.push("⇧");
  if (shortcut.key === "Enter") parts.push("↵");
  else if (shortcut.key === "/") parts.push("/");
  else parts.push(shortcut.key.toUpperCase());
  return parts.join(isMac ? "" : "+");
}

export function getShortcutsByContext(context: ShortcutContext): Shortcut[] {
  return SHORTCUTS.filter((s) => s.context === context || s.context === "global");
}
