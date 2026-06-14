"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteAiKeyApi,
  fetchAiKeysApi,
  saveAiKeyApi,
  type AiKeysStatus,
} from "@/lib/inbox/client-api";
import { AI_PROVIDER_CONFIG, type AiProvider } from "@/lib/ai/providers";

const PROVIDER_LINKS: Record<AiProvider, { label: string; href: string }> = {
  gemini: {
    label: "Google AI Studio",
    href: "https://aistudio.google.com/apikey",
  },
  openai: {
    label: "OpenAI dashboard",
    href: "https://platform.openai.com/api-keys",
  },
};

interface AiKeysSettingsProps {
  status: AiKeysStatus | null;
  onStatusChange: (status: AiKeysStatus) => void;
}

export function AiKeysSettings({ status, onStatusChange }: AiKeysSettingsProps) {
  const [drafts, setDrafts] = useState<Record<AiProvider, string>>({ gemini: "", openai: "" });
  const [saving, setSaving] = useState<AiProvider | null>(null);
  const [removing, setRemoving] = useState<AiProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveKey = async (provider: AiProvider) => {
    const apiKey = drafts[provider].trim();
    if (!apiKey) return;

    setSaving(provider);
    setError(null);
    try {
      await saveAiKeyApi(provider, apiKey);
      const next = await fetchAiKeysApi();
      onStatusChange(next);
      setDrafts((prev) => ({ ...prev, [provider]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save API key");
    } finally {
      setSaving(null);
    }
  };

  const removeKey = async (provider: AiProvider) => {
    setRemoving(provider);
    setError(null);
    try {
      const next = await deleteAiKeyApi(provider);
      onStatusChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove API key");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <section>
      <h3 className="text-sm font-semibold">AI providers</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Bring your own API keys. Keys are encrypted at rest. Platform keys are used as fallback
        when you leave a field blank.
      </p>

      {error && <p className="mt-2 text-xs text-[color:var(--color-destructive)]">{error}</p>}

      <div className="mt-4 space-y-4">
        {(["gemini", "openai"] as AiProvider[]).map((provider) => {
          const saved = status?.keys[provider];
          const platform = status?.platform[provider];
          const link = PROVIDER_LINKS[provider];

          return (
            <div key={provider} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{AI_PROVIDER_CONFIG[provider].label}</p>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                </a>
              </div>

              {saved ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Saved {saved.hint}
                  {platform ? " · platform fallback available" : ""}
                </p>
              ) : platform ? (
                <p className="mt-1 text-xs text-muted-foreground">Using platform key</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">No key configured</p>
              )}

              <Input
                type="password"
                className="mt-2"
                placeholder={
                  provider === "gemini" ? "AIza…" : "sk-…"
                }
                value={drafts[provider]}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [provider]: e.target.value }))
                }
                autoComplete="off"
              />

              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  disabled={!drafts[provider].trim() || saving === provider}
                  onClick={() => void saveKey(provider)}
                >
                  {saving === provider ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Testing…
                    </>
                  ) : (
                    "Test & save"
                  )}
                </Button>
                {saved && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={removing === provider}
                    onClick={() => void removeKey(provider)}
                  >
                    Remove key
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
