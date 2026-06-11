import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { auth } from "@/lib/auth";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { Button } from "@/components/ui/button";

interface ConnectPageProps {
  searchParams: Promise<{
    error?: string;
    reconnect?: string;
  }>;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  if (await isTenantFullyConnected(session.user.id)) {
    redirect("/inbox");
  }

  const params = await searchParams;
  const showReconnect = params.reconnect === "1";
  const error = params.error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card/40 p-8 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          One-time setup
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Connect Google</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;ll request Gmail and Calendar access back-to-back so your inbox can load real
          threads and events.
        </p>

        {showReconnect ? (
          <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Your Google connection expired. Reconnect to continue.
          </p>
        ) : null}

        {error === "kek_mismatch" ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Corsair credentials were encrypted with a different <code>CORSAIR_KEK</code>. In your
            project terminal run <code>bun run corsair:reset</code>, then click Connect Google again.
          </p>
        ) : null}

        {error && error !== "kek_mismatch" ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Connection failed. Please try again.
          </p>
        ) : null}

        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
            <Mail className="h-4 w-4 text-primary" />
            <span>Gmail — read and send on your behalf</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Google Calendar — read and manage events</span>
          </div>
        </div>

        <Button size="lg" className="mt-8 w-full gap-2" asChild>
          <Link href="/api/connect/google">
            Connect Google
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Signed in as {session.user.email}
        </p>
      </div>
    </div>
  );
}
