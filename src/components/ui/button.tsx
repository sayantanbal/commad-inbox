import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
  Command Inbox button system.

  Variants map 1:1 to design-system component names:
    • default          → button-primary       (Action Blue pill)
    • secondary-pill   → button-secondary-pill (ghost pill, blue border)
    • dark-utility     → button-dark-utility   (ink #1d1d1f, sm radius)
    • pearl-capsule    → button-pearl-capsule  (subtle neutral, md radius)
    • icon-circular    → button-icon-circular  (44×44 chip, full radius)

  Legacy variants kept (ghost, outline, destructive) so existing screens still
  compile while the alignment pass rolls out — they pass through the same
  base reset (scale on active, focus ring, etc.).
*/

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[transform,background-color,color,border-color] duration-150 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline focus-visible:outline-[color:var(--color-primary-focus)] focus-visible:outline-offset-2 focus-visible:outline-none-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground hover:bg-[color:var(--color-primary-focus)]",
        "secondary-pill":
          "rounded-full border border-primary bg-transparent text-primary hover:bg-[rgba(0,102,204,0.06)]",
        "dark-utility":
          "rounded-[8px] bg-[color:var(--color-ink)] text-[color:var(--color-on-dark)] hover:bg-[#2a2a2c]",
        "pearl-capsule":
          "rounded-[11px] border border-[color:var(--color-divider-soft)] bg-[color:var(--color-surface-pearl)] text-[color:var(--color-ink-muted-80)] hover:bg-white hover:text-[color:var(--color-ink)]",
        "icon-circular":
          "rounded-full bg-[color:var(--color-surface-chip)] text-[color:var(--color-ink-muted-80)] hover:text-[color:var(--color-ink)]",

        // Legacy / utility shorthands
        pill:
          "rounded-full border border-primary bg-transparent text-primary hover:bg-[rgba(0,102,204,0.06)]",
        secondary:
          "rounded-[8px] bg-[color:var(--color-canvas-parchment)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-pearl)]",
        ghost:
          "rounded-[8px] text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-pearl)]",
        outline:
          "rounded-[8px] border border-[color:var(--color-hairline)] bg-transparent text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-pearl)]",
        destructive:
          "rounded-[8px] bg-[rgba(255,59,48,0.10)] text-[color:var(--color-destructive)] hover:bg-[rgba(255,59,48,0.16)]",
      },
      size: {
        // Spec primary CTA: 11px × 22px padding, 17px / 400.
        default: "h-[42px] px-[22px] text-[17px] font-normal",
        // Utility & caption-sized actions: 14px / 400.
        sm: "h-9 px-3 text-[14px] font-normal",
        // Marketing CTA — same proportions, more shoulder room.
        lg: "h-[46px] px-7 text-[17px] font-normal",
        // Inline composer / inline action — tight pill.
        xs: "h-8 px-3 text-[14px] font-normal",
        // Square icon button (32×32) for inline thread-row actions.
        icon: "h-8 w-8",
        // Spec circular icon (44×44).
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
