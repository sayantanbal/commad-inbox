"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactsImportForm } from "@/components/contacts/contacts-import-form";

export function ContactsForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <ContactsImportForm
        googleConnectHref="/api/connect/google-contacts?returnTo=/onboarding/summary"
        onSuccess={(result) => {
          const contacts =
            result.kind === "gmail" ? "gmail" : result.kind === "demo" ? "demo" : "imported";
          router.push(`/onboarding/summary?contacts=${contacts}&count=${result.imported}`);
        }}
        onError={setError}
      />

      {error ? (
        <p className="type-caption text-[color:var(--color-destructive)]">{error}</p>
      ) : null}

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => router.push("/onboarding/summary?contacts=skipped")}
      >
        Skip for now
      </Button>

      <Button
        size="lg"
        className="w-full"
        onClick={() => router.push("/onboarding/summary?contacts=skipped")}
      >
        Continue without contacts
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
