"use client";

import { GripHorizontal, GripVertical } from "lucide-react";
import { Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function ResizeHandle({ className, orientation = "horizontal" }: ResizeHandleProps) {
  const isVertical = orientation === "vertical";

  return (
    <Separator
      className={cn(
        "group flex items-center justify-center outline-none",
        isVertical && "resize-handle-vertical",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full bg-border/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
          isVertical ? "h-1 w-8" : "h-8 w-1"
        )}
      >
        {isVertical ? (
          <GripHorizontal className="h-3 w-3 text-muted-foreground" />
        ) : (
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </Separator>
  );
}
