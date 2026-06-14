import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { getUserPreferences } from "@/lib/focus/window";
import { isOnboardingComplete } from "@/lib/onboarding/status";
import { WorkingDaysForm } from "./working-days-form";

export default async function WorkingDaysPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) redirect("/onboarding/connect");

  if (await isOnboardingComplete(session.user.id)) {
    redirect("/inbox");
  }

  const prefs = await getUserPreferences(session.user.id);

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <header className="px-6 py-6">
        <div className="mx-auto max-w-[640px]">
          <span className="type-body-strong text-ink">Command Inbox</span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-20">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-ink-muted-48)]/30" />
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-ink-muted-48)]/30" />
          </div>

          <div className="util-card" style={{ padding: 32 }}>
            <h1 className="type-display-md text-ink">When do you work?</h1>
            <p className="mt-3 type-body text-ink-muted-48">
              We use this to suggest meeting times and respect your availability.
              You can change it anytime in settings.
            </p>

            <div className="mt-8">
              <WorkingDaysForm
                initialTimezone={prefs.timezone || "UTC"}
                initialStructured={prefs.workingDaysStructured}
                initialTextOverride={prefs.workingDaysTextOverride}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
