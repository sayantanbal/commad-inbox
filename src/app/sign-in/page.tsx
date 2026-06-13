import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading sign-in…</div>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  );
}
