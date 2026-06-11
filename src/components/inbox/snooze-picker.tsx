"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSnoozePresets } from "@/lib/activity";

interface SnoozePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadSubject?: string;
  onSnooze: (until: Date, label: string) => void;
}

export function SnoozePicker({ open, onOpenChange, threadSubject, onSnooze }: SnoozePickerProps) {
  const presets = getSnoozePresets();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Snooze until
          </DialogTitle>
        </DialogHeader>

        {threadSubject && (
          <p className="truncate text-sm text-muted-foreground">{threadSubject}</p>
        )}

        <div className="space-y-1">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onSnooze(preset.until, preset.label);
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
            >
              <span>{preset.label}</span>
              <span className="text-xs text-muted-foreground">
                {format(preset.until, "MMM d · h:mm a")}
              </span>
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full" disabled>
          Custom time (coming soon)
        </Button>
      </DialogContent>
    </Dialog>
  );
}
