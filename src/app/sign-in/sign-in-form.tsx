"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInForm({ reason }: { reason?: string | null }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  async function handleGoogleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: next && next.startsWith("/") ? next : "/onboarding/connect",
    });
  }

  return (
    <div className="util-card w-full max-w-[480px] text-center" style={{ padding: 32 }}>
      <p
        className="type-caption-strong text-primary uppercase"
        style={{ letterSpacing: "0.08em" }}
      >
        Command Inbox
      </p>
      <h1 className="mt-4 type-display-md text-ink">Sign in to continue</h1>
      <p className="mt-3 type-body text-ink-muted-48">
        Connect your Google account to load real Gmail threads and calendar
        events.
      </p>

      {reason === "session_expired" ? (
        <p className="mt-5 rounded-[8px] border border-[color:var(--color-warning)]/30 bg-[#fff7e6] px-4 py-3 type-caption text-[color:var(--color-warning)]">
          Your session expired. Sign in again to continue.
        </p>
      ) : null}

      <Button size="lg" className="mt-8 w-full" onClick={handleGoogleSignIn}>
        Continue with Google
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </Button>

      <p className="mt-6 type-caption text-ink-muted-48">
        <Link href="/" className="hover:text-ink transition-colors">
          Back to home
        </Link>
      </p>
    </div>
  );
}
