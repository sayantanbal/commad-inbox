"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingContactsStatus } from "@/lib/contacts/onboarding-contacts-status";
import { useGoogleContactsPendingImport } from "@/lib/contacts/use-google-contacts-pending-import";

interface SummaryClientProps {
  contactsStatus: OnboardingContactsStatus;
  contactCount: number;
  importPending: boolean;
}

const UNLOCKED = [
  "Working-day aware scheduling",
  "Commitment tracking from Gmail",
  "AI daily brief",
];

const CONTACT_FEATURES = [
  "@ mentions in the agent",
  "People warmth alerts",
  "Meeting pre-brief context",
  "Send-time optimization per contact",
];

export function SummaryClient({
  contactsStatus: initialStatus,
  contactCount: initialCount,
  importPending,
}: SummaryClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [contactsStatus, setContactsStatus] = useState(initialStatus);
  const [contactCount, setContactCount] = useState(initialCount);

  const pendingImport = useGoogleContactsPendingImport(importPending, (result) => {
    setContactsStatus("google");
    setContactCount(result.imported);
  });

  useEffect(() => {
    setContactsStatus(initialStatus);
    setContactCount(initialCount);
  }, [initialStatus, initialCount]);

  const hasContacts = contactsStatus !== "skipped" && contactCount > 0;
  const isImporting = pendingImport.importing;

  async function finishOnboarding() {
    setSaving(true);
    try {
      const response = await fetch("/api/inbox/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingCompletedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Failed to complete onboarding");
      router.push("/inbox");
    } catch {
      setSaving(false);
    }
  }

  function contactsSummaryText(): string {
    if (isImporting) {
      return "Importing contacts from Google…";
    }
    if (pendingImport.error) {
      return "Google Contacts connected, but import failed. You can retry from People in the inbox.";
    }
    if (hasContacts) {
      return `${contactCount} contact${contactCount === 1 ? "" : "s"} imported.`;
    }
    if (contactsStatus === "google") {
      return "Google Contacts connected. No email addresses found to import.";
    }
    return "You skipped contacts — you can add them later from People.";
  }

  return (
    <div>
      <div className="rounded-[8px] bg-[rgba(0,102,204,0.06)] px-4 py-3">
        <p className="type-body-strong text-ink">You&apos;re ready for the inbox</p>
        <p className="mt-1 type-caption text-ink-muted-48 flex items-center gap-2">
          {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {contactsSummaryText()}
        </p>
        {pendingImport.notice && !isImporting ? (
          <p className="mt-1 type-caption text-ink-muted-48">{pendingImport.notice}</p>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <FeatureGroup title="Unlocked now" unlocked items={UNLOCKED} />
        <FeatureGroup
          title={hasContacts ? "Also unlocked" : "Limited without contacts"}
          unlocked={hasContacts}
          items={CONTACT_FEATURES}
        />
      </div>

      {!hasContacts && !isImporting ? (
        <p className="mt-6 type-caption text-ink-muted-48">
          Import contacts anytime from People, or scan sent mail to build your list.
        </p>
      ) : null}

      <Button
        size="lg"
        className="mt-8 w-full"
        disabled={saving || isImporting}
        onClick={() => void finishOnboarding()}
      >
        Open inbox
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}

function FeatureGroup({
  title,
  items,
  unlocked,
}: {
  title: string;
  items: string[];
  unlocked: boolean;
}) {
  const Icon = unlocked ? Unlock : Lock;
  return (
    <div>
      <p className="type-caption text-ink-muted-48 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 type-body text-ink">
            <Check
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${unlocked ? "text-primary" : "text-ink-muted-48"}`}
              strokeWidth={2}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
