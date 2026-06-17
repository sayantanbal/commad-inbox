import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { getUserPreferences } from "@/lib/focus/window";
import { isOnboardingComplete } from "@/lib/onboarding/status";
import { parseOnboardingContactsStatus } from "@/lib/contacts/onboarding-contacts-status";
import { SummaryClient } from "./summary-client";

interface SummaryPageProps {
  searchParams: Promise<{
    contacts?: string;
    count?: string;
    import?: string;
  }>;
}

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) redirect("/onboarding/connect");

  if (await isOnboardingComplete(session.user.id)) {
    redirect("/inbox");
  }

  const prefs = await getUserPreferences(session.user.id);
  if (!prefs.workingDaysStructured) {
    redirect("/onboarding/working-days");
  }

  const params = await searchParams;
  const contactsStatus = parseOnboardingContactsStatus(params.contacts);
  const contactCount = Number(params.count ?? "0") || 0;
  const importPending = params.import === "pending";

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
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>

          <div className="util-card" style={{ padding: 32 }}>
            <h1 className="type-display-md text-ink">Here&apos;s what you get</h1>
            <p className="mt-3 type-body text-ink-muted-48">
              Command Inbox is set up with your schedule
              {contactsStatus !== "skipped" ? " and contacts" : ""}.
            </p>

            <div className="mt-8">
              <SummaryClient
                contactsStatus={contactsStatus}
                contactCount={contactCount}
                importPending={importPending}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
