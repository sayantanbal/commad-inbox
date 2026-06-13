"use client";

import { format } from "date-fns";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeWeekDefrag, type DefragInsight } from "@/lib/calendar/defrag";
import type { CalendarEvent } from "@/lib/types";

interface DefragPanelProps {
  events: CalendarEvent[];
  onClose: () => void;
  onBlockFocusTime: (start: Date, durationMinutes: number) => Promise<void>;
}

function canBlockFocusTime(insight: DefragInsight): boolean {
  return (
    (insight.kind === "focus_slot" || insight.kind === "fragmented") &&
    !!insight.day &&
    !!insight.durationMinutes
  );
}

function blockButtonLabel(insight: DefragInsight): string {
  if (insight.kind === "fragmented") return "Block best slot";
  return "Block focus time";
}
function insightIcon(kind: DefragInsight["kind"]) {
  if (kind === "back_to_back") return "⚡";
  if (kind === "fragmented") return "📊";
  return "🎯";
}

export function DefragPanel({ events, onClose, onBlockFocusTime }: DefragPanelProps) {
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const insights = analyzeWeekDefrag(events);
  const weekLabel = format(new Date(), "MMM d");

  const handleBlock = async (insight: DefragInsight) => {
    if (!insight.day) return;
    setBlockingId(insight.id);
    try {
      await onBlockFocusTime(insight.day, insight.durationMinutes ?? 90);
    } finally {
      setBlockingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Defrag my week
          </p>
          <p className="text-[10px] text-muted-foreground">Week of {weekLabel}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close defrag">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your week looks balanced — no back-to-back clusters or heavy meeting days.
            </p>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border border-border/70 bg-secondary/30 px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {insightIcon(insight.kind)} {insight.label}
                </p>
                <p className="mt-1 text-sm text-foreground/90">{insight.detail}</p>
                {canBlockFocusTime(insight) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    disabled={blockingId === insight.id}
                    onClick={() => void handleBlock(insight)}
                  >
                    {blockingId === insight.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        Blocking…
                      </>
                    ) : (
                      blockButtonLabel(insight)
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
