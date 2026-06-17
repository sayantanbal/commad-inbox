import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarRange, Check, Mail, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { getOnboardingRedirectPath } from "@/lib/onboarding/status";
import { Button } from "@/components/ui/button";
import { ConnectSignOut } from "./connect-sign-out";

interface ConnectPageProps {
  searchParams: Promise<{
    error?: string;
    reconnect?: string;
  }>;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in?reason=session_expired");
  }

  const params = await searchParams;
  const showReconnect = params.reconnect === "1";
  const error = params.error;
  const stayOnConnect = showReconnect || Boolean(error);

  if (await isTenantFullyConnected(session.user.id)) {
    if (!stayOnConnect) {
      redirect(await getOnboardingRedirectPath(session.user.id));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      {/* Top wordmark */}
      <header className="px-6 py-6">
        <div className="mx-auto max-w-[640px]">
          <span className="type-body-strong text-ink">Command Inbox</span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-20">
        <div className="w-full max-w-[480px]">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-ink-muted-48)]/30" />
          </div>

          <div className="util-card" style={{ padding: 32 }}>
            <h1 className="type-display-md text-ink">
              Connect your Google account.
            </h1>
            <p className="mt-3 type-body text-ink-muted-48">
              Command Inbox reads Gmail and Calendar to triage your inbox and surface
              your commitments. We never store passwords.
            </p>

            {showReconnect ? (
              <p className="mt-5 rounded-[8px] border border-[color:var(--color-warning)]/30 bg-[#fff7e6] px-4 py-3 type-caption text-[color:var(--color-warning)]">
                Your Google connection expired. Reconnect to continue.
              </p>
            ) : null}

            {error === "kek_mismatch" ? (
              <p className="mt-5 rounded-[8px] border border-[color:var(--color-destructive)]/30 bg-[rgba(255,59,48,0.06)] px-4 py-3 type-caption text-[color:var(--color-destructive)]">
                Corsair credentials were encrypted with a different{" "}
                <code className="font-mono">CORSAIR_KEK</code>. Run{" "}
                <code className="font-mono">bun run corsair:reset</code>, then try
                again.
              </p>
            ) : null}

            {error && error !== "kek_mismatch" ? (
              <p className="mt-5 rounded-[8px] border border-[color:var(--color-destructive)]/30 bg-[rgba(255,59,48,0.06)] px-4 py-3 type-caption text-[color:var(--color-destructive)]">
                Connection failed. Please try again.
              </p>
            ) : null}

            <ul className="mt-6 space-y-3">
              <PermissionRow
                icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
                title="Read and send Gmail"
                detail="Triage threads, draft replies, send on approval."
              />
              <PermissionRow
                icon={<CalendarRange className="h-4 w-4" strokeWidth={1.75} />}
                title="Read and manage Calendar"
                detail="See availability, book meetings inline."
              />
              <PermissionRow
                icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
                title="Encrypted, scoped tokens only"
                detail="Disconnect anytime. We never see your password."
              />
            </ul>

            <Button asChild size="lg" className="mt-8 w-full">
              <Link href="/api/connect/google">
                Connect with Google
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>

            <p className="mt-4 text-center type-caption text-ink-muted-48">
              Your data stays yours. Disconnect anytime.
            </p>
          </div>

          <ConnectSignOut email={session.user.email} />
        </div>
      </main>
    </div>
  );
}

function PermissionRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-[2px] flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(0,102,204,0.10)] text-primary">
        <Check className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="flex-1">
        <p className="type-body text-ink flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </p>
        <p className="mt-1 type-caption text-ink-muted-48">{detail}</p>
      </div>
    </li>
  );
}
