"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SummaryClientProps {
  contactsStatus: "skipped" | "imported" | "gmail";
  contactCount: number;
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

export function SummaryClient({ contactsStatus, contactCount }: SummaryClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const hasContacts = contactsStatus !== "skipped" && contactCount > 0;

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

  return (
    <div>
      <div className="rounded-[8px] bg-[rgba(0,102,204,0.06)] px-4 py-3">
        <p className="type-body-strong text-ink">You&apos;re ready for the inbox</p>
        <p className="mt-1 type-caption text-ink-muted-48">
          {hasContacts
            ? `${contactCount} contact${contactCount === 1 ? "" : "s"} imported.`
            : "You skipped contacts — you can add them later from People."}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <FeatureGroup title="Unlocked now" unlocked items={UNLOCKED} />
        <FeatureGroup
          title={hasContacts ? "Also unlocked" : "Limited without contacts"}
          unlocked={hasContacts}
          items={CONTACT_FEATURES}
        />
      </div>

      {!hasContacts ? (
        <p className="mt-6 type-caption text-ink-muted-48">
          Import contacts anytime from People, or scan sent mail to build your list.
        </p>
      ) : null}

      <Button
        size="lg"
        className="mt-8 w-full"
        disabled={saving}
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
