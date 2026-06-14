import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-hairline bg-surface-black px-6 py-3">
        <Skeleton className="h-4 w-32 bg-white/20" />
      </header>
      <div className="mx-auto max-w-[1080px] px-6 py-24 text-center">
        <Skeleton className="mx-auto h-3 w-40" />
        <Skeleton className="mx-auto mt-6 h-12 w-full max-w-xl" />
        <Skeleton className="mx-auto mt-4 h-4 w-full max-w-md" />
        <div className="mx-auto mt-10 flex justify-center gap-3">
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}
