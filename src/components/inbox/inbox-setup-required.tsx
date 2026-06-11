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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card/40 p-8 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Setup required</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
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
