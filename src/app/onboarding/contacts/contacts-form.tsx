"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactsForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileUpload(file: File) {
    setLoading("upload");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/inbox/contacts/import", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Import failed");
      }
      const data = (await response.json()) as { imported: number };
      router.push(`/onboarding/summary?contacts=imported&count=${data.imported}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(null);
    }
  }

  async function handlePasteImport() {
    if (!pasteText.trim()) return;
    setLoading("paste");
    setError(null);
    try {
      const response = await fetch("/api/inbox/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Import failed");
      }
      const data = (await response.json()) as { imported: number };
      router.push(`/onboarding/summary?contacts=imported&count=${data.imported}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleGmailImport() {
    setLoading("google");
    setError(null);
    try {
      const response = await fetch("/api/inbox/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "gmail-sent" }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Import failed");
      }
      const data = (await response.json()) as { imported: number };
      router.push(`/onboarding/summary?contacts=gmail&count=${data.imported}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[8px] border border-hairline p-4">
        <div className="flex items-start gap-3">
          <Upload className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="type-body-strong text-ink">Upload a file</p>
            <p className="mt-1 type-caption text-ink-muted-48">
              .vcf, .csv, or plain email list
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".vcf,.csv,.txt,text/plain,text/csv"
              className="mt-3 block w-full text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-hairline p-4">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="type-body-strong text-ink">Paste emails</p>
            <textarea
              className="mt-3 min-h-[80px] w-full rounded-[8px] border border-border bg-input px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="alice@example.com&#10;bob@example.com"
            />
            <Button
              variant="secondary-pill"
              className="mt-3"
              disabled={!pasteText.trim() || loading === "paste"}
              onClick={() => void handlePasteImport()}
            >
              Import pasted list
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-hairline p-4">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="type-body-strong text-ink">Connect Google Contacts</p>
            <p className="mt-1 type-caption text-ink-muted-48">
              Read-only import into Command Inbox — Google Contacts is not modified.
            </p>
            <Button
              variant="secondary-pill"
              className="mt-3"
              disabled={Boolean(loading)}
              onClick={() => {
                window.location.href = "/api/connect/google-contacts?returnTo=/onboarding/summary";
              }}
            >
              Import from Google Contacts
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-hairline p-4">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="type-body-strong text-ink">Build from sent mail</p>
            <p className="mt-1 type-caption text-ink-muted-48">
              One-time scan of your Gmail sent folder — read-only, stored in Command Inbox only.
            </p>
            <Button
              variant="secondary-pill"
              className="mt-3"
              disabled={loading === "google"}
              onClick={() => void handleGmailImport()}
            >
              Scan sent mail
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="type-caption text-[color:var(--color-destructive)]">{error}</p>
      ) : null}

      <Button
        variant="ghost"
        className="w-full"
        disabled={Boolean(loading)}
        onClick={() => router.push("/onboarding/summary?contacts=skipped")}
      >
        Skip for now
      </Button>

      <Button
        size="lg"
        className="w-full"
        disabled={Boolean(loading)}
        onClick={() => router.push("/onboarding/summary?contacts=skipped")}
      >
        Continue without contacts
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
