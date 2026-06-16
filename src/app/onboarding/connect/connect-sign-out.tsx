"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";

export function ConnectSignOut({ email }: { email: string }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <p className="type-caption text-ink-muted-48">Signed in as {email}</p>
      <SignOutButton variant="ghost" />
    </div>
  );
}
