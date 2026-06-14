import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  titleWidth = "w-48",
  rows = 4,
}: {
  titleWidth?: string;
  rows?: number;
}) {
  return (
    <div className="min-h-screen bg-parchment px-6 py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className={`h-8 ${titleWidth}`} />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="util-card space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="mt-4 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
