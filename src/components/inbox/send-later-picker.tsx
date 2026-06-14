"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSendLaterPresets } from "@/lib/activity";
import type { SendTimeSuggestion } from "@/lib/schemas/domain";

interface SendLaterPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sendTimeSuggestion?: SendTimeSuggestion | null;
  onSchedule: (at: Date) => void;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SendLaterPicker({
  open,
  onOpenChange,
  sendTimeSuggestion,
  onSchedule,
}: SendLaterPickerProps) {
  const presets = getSendLaterPresets();
  const suggestedAt = sendTimeSuggestion
    ? new Date(sendTimeSuggestion.suggestedAt)
    : null;
  const defaultCustom = useMemo(() => {
    const d = suggestedAt ?? new Date(Date.now() + 3_600_000);
    d.setSeconds(0, 0);
    return toDatetimeLocalValue(d);
  }, [open, suggestedAt]);
  const [customValue, setCustomValue] = useState(defaultCustom);
  const [customError, setCustomError] = useState<string | null>(null);

  const pick = (at: Date) => {
    onSchedule(at);
    onOpenChange(false);
  };

  const applyCustom = () => {
    const at = new Date(customValue);
    if (Number.isNaN(at.getTime())) {
      setCustomError("Enter a valid date and time.");
      return;
    }
    if (at.getTime() <= Date.now()) {
      setCustomError("Pick a time in the future.");
      return;
    }
    setCustomError(null);
    pick(at);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0">
        <DialogHeader className="border-b border-hairline px-6 py-4">
          <DialogTitle className="type-tagline text-ink flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Send later
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-4">
          {sendTimeSuggestion && suggestedAt && (
            <button
              type="button"
              onClick={() => pick(suggestedAt)}
              className="flex w-full flex-col rounded-[8px] border border-primary/30 bg-[rgba(0,102,204,0.06)] px-3 py-3 text-left"
            >
              <span className="type-caption-strong text-primary">AI suggested</span>
              <span className="type-caption text-ink">
                {format(suggestedAt, "EEE, MMM d · h:mm a")}
              </span>
              <span className="type-fine text-ink-muted-48">{sendTimeSuggestion.reason}</span>
            </button>
          )}
          <div className="space-y-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => pick(preset.at)}
                className="flex w-full items-center justify-between rounded-[8px] border border-hairline px-3 py-3 text-left type-caption text-ink hover:bg-pearl"
              >
                <span>{preset.label}</span>
                <span className="type-fine text-ink-muted-48">
                  {format(preset.at, "MMM d · h:mm a")}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2 rounded-[8px] border border-hairline p-3">
            <p className="type-caption-strong text-ink">Pick time</p>
            <Input
              type="datetime-local"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setCustomError(null);
              }}
            />
            {customError && (
              <p className="type-fine text-[color:var(--color-destructive)]">{customError}</p>
            )}
            <Button size="sm" className="w-full" onClick={applyCustom}>
              Schedule send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
