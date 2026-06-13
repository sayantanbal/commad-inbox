"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Sparkles } from "lucide-react";
import { ActionChips } from "@/components/inbox/action-chips";
import { fetchDailyBriefApi } from "@/lib/inbox/client-api";
import type { DailyBrief, SuggestedAction } from "@/lib/schemas/domain";
import type { AiProvider } from "@/lib/ai/providers";

interface DailyBriefPanelProps {
  userEmail: string;
  provider: AiProvider;
  invalidationKey?: number;
  onAction: (action: SuggestedAction) => void;
}

export function DailyBriefPanel({
  userEmail,
  provider,
  invalidationKey = 0,
  onAction,
}: DailyBriefPanelProps) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "cache" | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDailyBriefApi(provider, {
          refresh,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setBrief(result.brief);
        setSource(result.source);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load daily brief");
        setBrief(null);
        setSource(null);
      } finally {
        setLoading(false);
      }
    },
    [provider]
  );

  useEffect(() => {
    void load(false);
  }, [load, invalidationKey]);

  const displayName = userEmail.split("@")[0] ?? "there";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-5">
        <p className="font-serif text-2xl tracking-tight text-foreground">
          {brief?.greeting ?? `Good morning, ${displayName}`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {brief?.subtitle ?? format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your day…
          </div>
        )}

        {error && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => void load(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {brief && !loading && (
          <div className="mx-auto max-w-2xl space-y-8">
            {brief.items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid grid-cols-[5.5rem_1fr] gap-4">
                <p className="pt-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                  {item.label}
                </p>
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-foreground/90">{item.text}</p>
                  {item.actions && item.actions.length > 0 && (
                    <ActionChips actions={item.actions} onAction={onAction} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        {source === "cache" && !loading && (
          <span className="text-[10px] text-muted-foreground">Cached — updates when inbox or calendar changes</span>
        )}
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          Refresh brief
        </button>
      </div>
    </div>
  );
}
