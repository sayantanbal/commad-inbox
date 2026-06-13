"use client";

import type { SuggestedAction } from "@/lib/schemas/domain";
import { cn } from "@/lib/utils";

interface ActionChipsProps {
  actions: SuggestedAction[];
  onAction: (action: SuggestedAction) => void;
  className?: string;
}

export function ActionChips({ actions, onAction, className }: ActionChipsProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action, index) => (
        <button
          key={`${action.type}-${action.label}-${index}`}
          type="button"
          onClick={() => onAction(action)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
