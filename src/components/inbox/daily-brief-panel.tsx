"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, Sparkles } from "lucide-react";
import { ActionChips } from "@/components/inbox/action-chips";
import { streamDailyBriefApi } from "@/lib/inbox/client-api";
import type { DailyBrief, SuggestedAction } from "@/lib/schemas/domain";
import type { AiProvider } from "@/lib/ai/providers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyBriefPanelProps {
  userEmail: string;
  provider: AiProvider;
  invalidationKey?: number;
  onAction: (action: SuggestedAction) => void;
  onOpenSettings?: () => void;
}

export function DailyBriefPanel({
  userEmail,
  provider,
  invalidationKey = 0,
  onAction,
  onOpenSettings,
}: DailyBriefPanelProps) {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Preparing your day…");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "cache" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setStreaming(false);
      setError(null);
      setBrief(null);
      setSource(null);
      setStatusMessage("Preparing your day…");

      try {
        await streamDailyBriefApi(provider, {
          refresh,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "status") {
              setStatusMessage(event.message);
              return;
            }
            if (event.type === "partial") {
              setStreaming(true);
              setBrief((prev) => ({
                greeting: event.brief.greeting ?? prev?.greeting ?? "",
                subtitle: event.brief.subtitle ?? prev?.subtitle ?? format(new Date(), "EEEE, MMMM d"),
                items: event.brief.items ?? prev?.items ?? [],
              }));
              return;
            }
            if (event.type === "complete") {
              setBrief(event.brief);
              setSource(event.source);
              setStreaming(false);
            }
          },
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load daily brief");
        setBrief(null);
        setSource(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setStreaming(false);
        }
      }
    },
    [provider]
  );

  useEffect(() => {
    void load(false);
    return () => abortRef.current?.abort();
  }, [load, invalidationKey]);

  const displayName = userEmail.split("@")[0] ?? "there";
  const showSkeleton = loading && !brief;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <div className="border-b border-hairline px-6 py-6">
        <p className="type-display-md text-ink" style={{ fontSize: 28 }}>
          {showSkeleton ? (
            <Skeleton className="inline-block h-8 w-72 max-w-full" />
          ) : (
            brief?.greeting ?? `Good morning, ${displayName}.`
          )}
        </p>
        <p className="mt-2 type-body text-ink-muted-48">
          {brief?.subtitle ?? format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {loading && (
          <div className="mb-8 flex items-center gap-2 type-caption text-ink-muted-48">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            {statusMessage}
            {streaming && brief && (
              <span className="text-primary">· streaming</span>
            )}
          </div>
        )}

        {showSkeleton && (
          <div className="mx-auto max-w-2xl space-y-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[6rem_1fr] gap-6">
                <Skeleton className="h-4 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="space-y-3">
            <p className="type-caption text-[color:var(--color-destructive)]">{error}</p>
            {error.includes("Settings") && onOpenSettings && (
              <Button variant="outline" size="sm" onClick={onOpenSettings}>
                Open AI settings
              </Button>
            )}
            <button
              type="button"
              onClick={() => void load(true)}
              className="type-caption text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {brief && brief.items.length > 0 && (
          <div className="mx-auto max-w-2xl space-y-8">
            {brief.items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid grid-cols-[6rem_1fr] gap-6">
                <p
                  className="pt-0.5 type-caption-strong text-primary uppercase"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {item.label}
                </p>
                <div className="space-y-3">
                  <p className="type-body text-ink">{item.text}</p>
                  {item.actions && item.actions.length > 0 && (
                    <ActionChips actions={item.actions} onAction={onAction} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-6 py-3">
        {source === "cache" && !loading && (
          <span className="type-fine text-ink-muted-48">
            Cached — updates when inbox or calendar changes
          </span>
        )}
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 type-caption text-ink-muted-80 hover:text-ink disabled:opacity-50 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
          Refresh brief
        </button>
      </div>
    </div>
  );
}
