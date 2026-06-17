import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

interface SignInPageProps {
  searchParams: Promise<{
    next?: string;
    reason?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const params = await searchParams;
    const next = params.next;
    redirect(next && next.startsWith("/") ? next : "/onboarding/connect");
  }

  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading sign-in…</div>
        }
      >
        <SignInForm reason={params.reason ?? null} />
      </Suspense>
    </div>
  );
}
