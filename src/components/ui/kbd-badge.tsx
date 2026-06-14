import * as React from "react";
import { cn } from "@/lib/utils";

/*
  Keyboard shortcut chip.

  Usage:
    <KbdBadge>G</KbdBadge><KbdBadge>I</KbdBadge>
    <KbdBadge combo>⌘ K</KbdBadge>
    <KbdBadge onDark>⏎</KbdBadge>

  Sizing follows the spec: 20px tall, min-width 20px, mono font, fine-print 12px,
  rounded 5px (xs), background = surface-chip-translucent (rgba(210,210,215,0.64)).
*/

export interface KbdBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Render with the dark-tile palette (semi-transparent white). */
  onDark?: boolean;
  /** Tighten width when the chip holds a multi-key combo. */
  combo?: boolean;
}

export const KbdBadge = React.forwardRef<HTMLSpanElement, KbdBadgeProps>(
  function KbdBadge({ className, onDark, combo, children, ...props }, ref) {
    return (
      <kbd
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          "kbd-badge",
          onDark && "kbd-badge--on-dark",
          combo && "px-[7px]",
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);

/**
 * Render a sequence of keys with consistent spacing.
 *   <KbdSequence keys={["G", "I"]} />
 */
export function KbdSequence({
  keys,
  onDark,
  className,
}: {
  keys: string[];
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((k, i) => (
        <KbdBadge key={`${k}-${i}`} onDark={onDark}>
          {k}
        </KbdBadge>
      ))}
    </span>
  );
}
