"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSnoozePresets } from "@/lib/activity";

interface SnoozePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadSubject?: string;
  timezone?: string;
  onSnooze: (until: Date, label: string) => void;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SnoozePicker({
  open,
  onOpenChange,
  threadSubject,
  onSnooze,
}: SnoozePickerProps) {
  const presets = getSnoozePresets();
  const defaultCustom = useMemo(() => {
    const d = new Date(Date.now() + 3_600_000);
    d.setSeconds(0, 0);
    return toDatetimeLocalValue(d);
  }, [open]);
  const [customValue, setCustomValue] = useState(defaultCustom);
  const [customError, setCustomError] = useState<string | null>(null);

  const applyCustom = () => {
    const until = new Date(customValue);
    if (Number.isNaN(until.getTime())) {
      setCustomError("Enter a valid date and time.");
      return;
    }
    if (until.getTime() <= Date.now()) {
      setCustomError("Pick a time in the future.");
      return;
    }
    setCustomError(null);
    onSnooze(until, `Custom · ${format(until, "MMM d · h:mm a")}`);
    onOpenChange(false);
  };

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
            <p className="truncate type-caption text-ink-muted-48">{threadSubject}</p>
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

          <div className="space-y-2 rounded-[8px] border border-hairline p-3">
            <p className="type-caption-strong text-ink">Custom time</p>
            <Input
              type="datetime-local"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setCustomError(null);
              }}
              className="type-caption"
            />
            {customError && (
              <p className="type-fine text-[color:var(--color-destructive)]">{customError}</p>
            )}
            <Button size="sm" className="w-full" onClick={applyCustom}>
              Snooze until custom time
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
