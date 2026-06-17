"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const UNDO_DURATION_MS = 5000;

export interface UndoState {
  message: string;
  onUndo: () => void;
}

interface UndoToastProps {
  undo: UndoState | null;
  onDismiss: () => void;
}

export function UndoToast({ undo, onDismiss }: UndoToastProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!undo) return;

    const start = Date.now();
    setSecondsLeft(5);
    setProgress(100);

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, UNDO_DURATION_MS - elapsed);
      setSecondsLeft(Math.ceil(remaining / 1000));
      setProgress((remaining / UNDO_DURATION_MS) * 100);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [undo, onDismiss]);

  return (
    <AnimatePresence>
      {undo && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-popover shadow-lg pb-[env(safe-area-inset-bottom)]"
        >
          <div
            className="h-0.5 bg-primary transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 text-sm">{undo.message}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{secondsLeft}s</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                undo.onUndo();
                onDismiss();
              }}
            >
              Undo
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
