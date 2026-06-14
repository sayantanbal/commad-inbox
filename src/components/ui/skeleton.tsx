import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[8px] bg-[color:var(--color-divider-soft)]",
        className
      )}
    />
  );
}
