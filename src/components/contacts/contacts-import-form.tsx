"use client";

import { useRef, useState } from "react";
import { Mail, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ContactsImportSuccess = {
  kind: "file" | "paste" | "gmail" | "demo" | "google";
  imported: number;
};

interface ContactsImportFormProps {
  googleConnectHref: string;
  disabled?: boolean;
  hideGoogleConnect?: boolean;
  onSuccess: (result: ContactsImportSuccess) => void;
  onError?: (message: string) => void;
  showDemo?: boolean;
}

export function ContactsImportForm({
  googleConnectHref,
  disabled = false,
  hideGoogleConnect = false,
  onSuccess,
  onError,
  showDemo = true,
}: ContactsImportFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function runImport(
    key: string,
    request: () => Promise<Response>,
    kind: ContactsImportSuccess["kind"]
  ): Promise<boolean> {
    setLoading(key);
    try {
      const response = await request();
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Import failed");
      }
      const data = (await response.json()) as { imported: number };
      onSuccess({ kind, imported: data.imported });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      onError?.(message);
      return false;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {showDemo ? (
        <div className="rounded-[8px] border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 text-primary" strokeWidth={1.75} />
            <div className="flex-1">
              <p className="type-body-strong text-ink">Use demo contacts</p>
              <p className="mt-1 type-caption text-ink-muted-48">
                Includes friend@corsair.dev for agent demos — no Google People API required.
              </p>
              <Button
                variant="secondary-pill"
                className="mt-3"
                disabled={disabled || loading === "demo"}
                onClick={() =>
                  void runImport(
                    "demo",
                    () =>
                      fetch("/api/inbox/contacts/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ source: "demo-contacts" }),
                      }),
                    "demo"
                  )
                }
              >
                Load demo contacts
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
              disabled={disabled || Boolean(loading)}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void runImport(
                  "upload",
                  () => {
                    const formData = new FormData();
                    formData.append("file", file);
                    return fetch("/api/inbox/contacts/import", {
                      method: "POST",
                      body: formData,
                    });
                  },
                  "file"
                );
                e.target.value = "";
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
              disabled={disabled || Boolean(loading)}
            />
            <Button
              variant="secondary-pill"
              className="mt-3"
              disabled={disabled || !pasteText.trim() || loading === "paste"}
              onClick={() =>
                void runImport(
                  "paste",
                  () =>
                    fetch("/api/inbox/contacts/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: pasteText }),
                    }),
                  "paste"
                ).then((done) => {
                  if (done !== false) setPasteText("");
                })
              }
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
            <p className="type-body-strong text-ink">Build from sent mail</p>
            <p className="mt-1 type-caption text-ink-muted-48">
              One-time scan of your Gmail sent folder — read-only, stored in Command Inbox only.
            </p>
            <Button
              variant="secondary-pill"
              className="mt-3"
              disabled={disabled || loading === "gmail"}
              onClick={() =>
                void runImport(
                  "gmail",
                  () =>
                    fetch("/api/inbox/contacts/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ source: "gmail-sent" }),
                    }),
                  "gmail"
                )
              }
            >
              Scan sent mail
            </Button>
          </div>
        </div>
      </div>

      {hideGoogleConnect ? null : (
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
              disabled={disabled || Boolean(loading)}
              onClick={() => {
                window.location.href = googleConnectHref;
              }}
            >
              {loading === "google" ? "Connecting…" : "Connect Google Contacts"}
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
