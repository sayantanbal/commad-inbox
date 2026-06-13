import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InboxSetupRequiredProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function InboxSetupRequired({
  title,
  description,
  actionHref,
  actionLabel = "Open setup link",
}: InboxSetupRequiredProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 shadow-[0_12px_48px_-16px_rgba(0,0,0,0.18)]">
        <p className="text-[15px] font-semibold tracking-tight text-primary">Setup required</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.022em]">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {actionHref ? (
            <Button asChild>
              <a href={actionHref} target="_blank" rel="noreferrer">
                {actionLabel}
              </a>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link href="/onboarding/connect">Back to connect</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
