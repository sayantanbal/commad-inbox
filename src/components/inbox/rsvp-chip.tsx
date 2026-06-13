"use client";

import { cn } from "@/lib/utils";
import type { RsvpSummary } from "@/lib/inbox/rsvp";

interface RsvpChipProps {
  summary: RsvpSummary;
  className?: string;
}

export function RsvpChip({ summary, className }: RsvpChipProps) {
  if (summary.kind === "none") return null;

  const tone =
    summary.kind === "accepted"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : summary.kind === "declined"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : summary.kind === "pending"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
          : "border-border bg-secondary text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        tone,
        className
      )}
    >
      {summary.label}
    </span>
  );
}
