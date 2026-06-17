"use client";

import { useEffect, useRef } from "react";
import {
  isShortcutEnabled,
  isSingleKeyLayerOpen,
  SHORTCUTS,
  type ShortcutGateState,
} from "@/lib/shortcuts";
import type { Shortcut } from "@/lib/types";

const CHORD_ARM_MS = 800;

const CHORD_ACTIONS: Record<string, string> = {
  i: "navInbox",
  s: "navSnoozed",
  c: "navCalendar",
  t: "navCommitments",
  w: "navWaiting",
  b: "navBrief",
};

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

function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}

export function useInboxShortcuts(
  state: ShortcutGateState,
  isMac: boolean,
  onAction: (action: string) => void
) {
  const chordArmedRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const disarmChord = () => {
      chordArmedRef.current = false;
      if (chordTimerRef.current) {
        clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    };

    const armChord = () => {
      chordArmedRef.current = true;
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
      chordTimerRef.current = setTimeout(disarmChord, CHORD_ARM_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const inInput = isTypingTarget(event);
      const key = event.key.toLowerCase();

      if (
        chordArmedRef.current &&
        !inInput &&
        !isSingleKeyLayerOpen(state) &&
        CHORD_ACTIONS[key]
      ) {
        event.preventDefault();
        disarmChord();
        onAction(CHORD_ACTIONS[key]);
        return;
      }

      if (
        key === "g" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !inInput &&
        !isSingleKeyLayerOpen(state)
      ) {
        event.preventDefault();
        armChord();
        return;
      }

      if (chordArmedRef.current && key !== "g") {
        disarmChord();
      }

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
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      disarmChord();
    };
  }, [isMac, onAction, state]);
}
