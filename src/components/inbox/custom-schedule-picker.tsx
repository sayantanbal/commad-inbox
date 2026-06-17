"use client";

import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CustomSchedulePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMinutes: number;
  title?: string;
  onSelect: (slot: Date) => void;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CustomSchedulePicker({
  open,
  onOpenChange,
  durationMinutes,
  title = "Pick a custom time",
  onSelect,
}: CustomSchedulePickerProps) {
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const d = new Date(Date.now() + 3_600_000);
    d.setSeconds(0, 0);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0);
    setCustomValue(toDatetimeLocalValue(d));
    setCustomError(null);
  }, [open]);

  const applyCustom = () => {
    const slot = new Date(customValue);
    if (Number.isNaN(slot.getTime())) {
      setCustomError("Enter a valid date and time.");
      return;
    }
    if (slot.getTime() <= Date.now()) {
      setCustomError("Pick a time in the future.");
      return;
    }
    setCustomError(null);
    onSelect(slot);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0">
        <DialogHeader className="border-b border-hairline px-6 py-4">
          <DialogTitle className="type-tagline text-ink flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" strokeWidth={1.75} />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          <p className="type-caption text-ink-muted-48">
            {durationMinutes}-minute meeting · minute precision
          </p>
          <Input
            type="datetime-local"
            value={customValue}
            onChange={(event) => {
              setCustomValue(event.target.value);
              setCustomError(null);
            }}
            className="type-body"
          />
          {customError && (
            <p className="type-caption text-[color:var(--color-destructive)]">{customError}</p>
          )}
          <Button className="w-full" onClick={applyCustom}>
            Use {format(new Date(customValue), "EEE, MMM d · h:mm a")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
