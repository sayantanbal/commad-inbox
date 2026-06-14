import { Skeleton } from "@/components/ui/skeleton";

function ThreadRowSkeleton() {
  return (
    <div className="flex min-h-[72px] flex-col justify-center gap-2 border-b border-divider-soft px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3.5 w-4/5 max-w-[240px]" />
      <Skeleton className="h-3 w-3/5 max-w-[180px]" />
    </div>
  );
}

export function InboxShellSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex h-screen flex-col bg-background text-ink">
      {/* Top bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-hairline bg-parchment px-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="hidden h-9 w-full max-w-[320px] rounded-full md:block" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {message && (
        <div className="border-b border-hairline bg-parchment px-4 py-2">
          <p className="type-caption text-ink-muted-48">{message}</p>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-hairline bg-parchment p-3 md:flex">
          <Skeleton className="mb-4 h-3 w-16" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`nav-${i}`} className="mb-2 h-9 w-full" />
          ))}
          <div className="mt-auto border-t border-hairline pt-3">
            <Skeleton className="h-9 w-full" />
          </div>
        </aside>

        {/* Thread list */}
        <div className="w-[320px] shrink-0 border-r border-hairline bg-canvas">
          <div className="flex border-b border-hairline">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`lane-${i}`} className="m-2 h-8 flex-1" />
            ))}
          </div>
          <div className="border-b border-divider-soft p-4">
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <ThreadRowSkeleton key={`row-${i}`} />
          ))}
        </div>

        {/* Thread view */}
        <div className="hidden min-w-0 flex-1 flex-col bg-canvas lg:flex">
          <div className="flex gap-2 border-b border-hairline px-4 py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`tool-${i}`} className="h-8 w-20 rounded-[8px]" />
            ))}
          </div>
          <div className="border-b border-hairline px-6 py-5">
            <Skeleton className="h-6 w-2/3 max-w-md" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
          <div className="flex-1 space-y-6 p-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`msg-${i}`} className="flex gap-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-hairline p-4">
            <Skeleton className="h-[120px] w-full rounded-[8px]" />
          </div>
        </div>

        {/* Agent panel */}
        <aside className="hidden w-[320px] shrink-0 flex-col border-l border-hairline bg-canvas xl:flex">
          <div className="border-b border-hairline px-4 py-3">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex-1 space-y-4 p-4">
            <Skeleton className="ml-8 h-16 w-4/5 rounded-[18px]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="border-t border-hairline p-3">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}
