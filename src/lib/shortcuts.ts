import type { Shortcut, ShortcutContext } from "./types";

export const SHORTCUTS: Shortcut[] = [
  { id: "next-thread", key: "j", context: "list", action: "nextThread", description: "Next thread" },
  { id: "prev-thread", key: "k", context: "list", action: "prevThread", description: "Previous thread" },
  { id: "archive", key: "e", context: "thread", action: "archive", description: "Archive (move to Done)", requiresThread: true },
  { id: "reply", key: "r", context: "thread", action: "reply", description: "Reply", requiresThread: true },
  { id: "meeting", key: "m", context: "thread", action: "meeting", description: "Schedule or reschedule meeting", requiresThread: true },
  { id: "snooze", key: "s", context: "thread", action: "snooze", description: "Snooze", requiresThread: true },
  { id: "waiting-for", key: "w", context: "global", action: "waitingFor", description: "Waiting For list" },
  { id: "pre-brief", key: "b", context: "thread", action: "preBrief", description: "Meeting pre-brief", requiresThread: true },
  { id: "export-task", key: "t", context: "thread", action: "exportTask", description: "Export to Linear", requiresThread: true },
  { id: "fulfill-commitment", key: "f", context: "thread", action: "fulfillCommitment", description: "Fulfill commitment", requiresThread: true },
  { id: "search", key: "/", context: "global", action: "search", description: "Semantic search" },
  { id: "help", key: "/", shift: true, context: "global", action: "help", description: "Shortcut cheat sheet" },
  { id: "select", key: "x", context: "list", action: "select", description: "Toggle multi-select" },
  { id: "palette", key: "k", mod: true, context: "global", action: "palette", description: "Command palette" },
  { id: "advanced-search", key: "f", mod: true, shift: true, context: "global", action: "advancedSearch", description: "Advanced search" },
  { id: "send", key: "Enter", mod: true, context: "composer", action: "send", description: "Send email" },
  { id: "cancel-composer", key: "Escape", context: "composer", action: "cancelComposer", description: "Close composer" },
  {
    id: "cancel-meeting",
    context: "thread",
    key: "",
    action: "cancelMeeting",
    description: "Cancel linked meeting",
    paletteOnly: true,
    requiresThread: true,
  },
];

export function getModLabel(isMac: boolean): string {
  return isMac ? "⌘" : "Ctrl";
}

export function formatShortcut(shortcut: Shortcut, isMac: boolean): string {
  if (shortcut.paletteOnly) return "—";

  const parts: string[] = [];
  if (shortcut.mod) parts.push(getModLabel(isMac));
  if (shortcut.shift) parts.push("⇧");

  if (shortcut.key === "Enter") parts.push("↵");
  else if (shortcut.key === "Escape") parts.push("Esc");
  else if (shortcut.key === "/" && shortcut.shift) parts.push("?");
  else if (shortcut.key === "/") parts.push("/");
  else if (shortcut.key) parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? "" : "+");
}

export function toHotkeyBinding(shortcut: Shortcut): string | null {
  if (shortcut.paletteOnly || !shortcut.key) return null;

  const parts: string[] = [];
  if (shortcut.mod) parts.push("mod");
  if (shortcut.shift) parts.push("shift");
  parts.push(shortcut.key === "Enter" ? "enter" : shortcut.key === "Escape" ? "escape" : shortcut.key);
  return parts.join("+");
}

export function getShortcutsByContext(context: ShortcutContext): Shortcut[] {
  return SHORTCUTS.filter((shortcut) => shortcut.context === context);
}

export function getPaletteShortcuts(): Shortcut[] {
  return SHORTCUTS.filter(
    (shortcut) => shortcut.action !== "send" && shortcut.action !== "cancelComposer"
  );
}

export interface ShortcutGateState {
  composerOpen: boolean;
  paletteOpen: boolean;
  snoozeOpen: boolean;
  availabilityOpen: boolean;
  cheatsheetOpen: boolean;
  searchOpen: boolean;
  advancedSearchOpen: boolean;
  selectedThreadId: string | null;
}

export function isSingleKeyLayerOpen(state: ShortcutGateState): boolean {
  return (
    state.composerOpen ||
    state.paletteOpen ||
    state.snoozeOpen ||
    state.availabilityOpen ||
    state.cheatsheetOpen ||
    state.searchOpen ||
    state.advancedSearchOpen
  );
}

export function isShortcutEnabled(shortcut: Shortcut, state: ShortcutGateState): boolean {
  if (shortcut.paletteOnly) return false;

  const binding = toHotkeyBinding(shortcut);
  if (!binding) return false;

  const isSingleKey = !shortcut.mod && shortcut.key.length === 1;
  if (isSingleKey && isSingleKeyLayerOpen(state)) return false;

  if (shortcut.requiresThread && !state.selectedThreadId) return false;

  if (shortcut.context === "composer" && !state.composerOpen) return false;
  if (shortcut.context !== "composer" && shortcut.context !== "global" && state.composerOpen) {
    return false;
  }

  return true;
}
