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
      <DialogContent className="max-w-[420px] p-0">
        <DialogHeader className="border-b border-hairline px-6 py-4">
          <DialogTitle className="type-tagline text-ink flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Snooze until
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {threadSubject && (
            <p className="truncate type-caption text-ink-muted-48">
              {threadSubject}
            </p>
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
                className="flex w-full items-center justify-between rounded-[8px] border border-hairline px-3 py-3 text-left type-caption text-ink hover:bg-pearl transition-colors"
              >
                <span>{preset.label}</span>
                <span className="type-fine text-ink-muted-48">
                  {format(preset.until, "MMM d · h:mm a")}
                </span>
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full" disabled>
            Custom time (coming soon)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
