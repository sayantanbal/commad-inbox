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
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-[0_12px_48px_-16px_rgba(0,0,0,0.18)]">
      <p className="text-[15px] font-semibold tracking-tight text-primary">Command Inbox</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.022em]">Sign in to continue</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
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
