"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronUp, Clock, Loader2, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/activity";

const typeIcon = {
  scheduled_send: Mail,
  snooze: Clock,
  background: Loader2,
};

interface ActivityBarProps {
  items: ActivityItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ActivityBar({
  items,
  open,
  onOpenChange,
  onDismiss,
  onCancel,
}: ActivityBarProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;
    setExpanded(true);
    onOpenChange(true);
    const timer = setTimeout(() => setExpanded(false), 4000);
    return () => clearTimeout(timer);
  }, [items.length, onOpenChange]);

  useEffect(() => {
    if (open) setExpanded(true);
  }, [open]);

  if (!open && items.length === 0) return null;

  const hasBackground = items.some((i) => i.type === "background");
  const isExpanded = expanded || open;

  return (
    <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm">
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            onOpenChange(true);
          }}
          className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-accent/40"
        >
          <span className="flex items-center gap-2 text-xs font-medium">
            {hasBackground && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            Activity{items.length > 0 ? ` (${items.length})` : ""}
          </span>
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              onOpenChange(false);
            }}
            className="flex w-full items-center justify-between border-b border-border/60 px-4 py-1.5 text-left transition-colors hover:bg-accent/40"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Activity
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {items.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              No active background tasks. Scheduled sends and snoozes appear here.
            </p>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-2">
              {items.map((item) => {
                const Icon = typeIcon[item.type];
                const isBackground = item.type === "background";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md border border-border bg-secondary/60 px-3 py-1.5",
                      isBackground && "min-w-[180px]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 text-primary",
                        isBackground && "animate-spin"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{item.label}</p>
                      {item.detail && (
                        <p className="truncate text-[10px] text-muted-foreground">{item.detail}</p>
                      )}
                      {item.at && !isBackground && (
                        <p className="text-[10px] text-muted-foreground">
                          {format(item.at, "h:mm a")}
                        </p>
                      )}
                    </div>
                    {isBackground && item.progress !== undefined && (
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {onCancel && item.type !== "background" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px]"
                        onClick={() => onCancel(item.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDismiss(item.id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      aria-label="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
