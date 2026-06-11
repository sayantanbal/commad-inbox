"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  async function handleGoogleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: next && next.startsWith("/") ? next : "/onboarding/connect",
    });
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card/40 p-8 text-center backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Command Inbox</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sign in to continue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Connect your Google account to load real Gmail threads and calendar events.
      </p>

      <Button size="lg" className="mt-8 w-full gap-2" onClick={handleGoogleSignIn}>
        Continue with Google
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
