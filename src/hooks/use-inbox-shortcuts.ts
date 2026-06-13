"use client";

import { useEffect } from "react";
import {
  isShortcutEnabled,
  SHORTCUTS,
  type ShortcutGateState,
} from "@/lib/shortcuts";
import type { Shortcut } from "@/lib/types";

function isModPressed(event: KeyboardEvent, isMac: boolean): boolean {
  return isMac ? event.metaKey : event.ctrlKey;
}

function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut, isMac: boolean): boolean {
  if (shortcut.paletteOnly || !shortcut.key) return false;

  const wantsMod = !!shortcut.mod;
  const wantsShift = !!shortcut.shift;
  const hasMod = isModPressed(event, isMac);
  const hasShift = event.shiftKey;

  if (wantsMod !== hasMod) return false;
  if (wantsShift !== hasShift) return false;
  if (!wantsMod && !wantsShift && (event.metaKey || event.ctrlKey || event.altKey)) return false;

  if (shortcut.key === "Enter") return event.key === "Enter";
  if (shortcut.key === "Escape") return event.key === "Escape";
  if (shortcut.key === "/" && shortcut.shift) {
    return event.key === "?" || (event.key === "/" && event.shiftKey);
  }

  return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

export function useInboxShortcuts(
  state: ShortcutGateState,
  isMac: boolean,
  onAction: (action: string) => void
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const inInput =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;

      for (const shortcut of SHORTCUTS) {
        if (!eventMatchesShortcut(event, shortcut, isMac)) continue;
        if (shortcut.context === "composer" && !inInput && shortcut.key !== "Escape") continue;
        if (shortcut.context !== "composer" && inInput && !shortcut.mod) continue;
        if (!isShortcutEnabled(shortcut, state)) continue;

        if (shortcut.mod || shortcut.action === "palette" || shortcut.action === "advancedSearch") {
          event.preventDefault();
        }

        onAction(shortcut.action);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMac, onAction, state]);
}
