"use client";

import { useEffect, useState } from "react";
import { ChevronUp, Loader2, Sparkles } from "lucide-react";
import { ActionChips } from "@/components/inbox/action-chips";
import { Button } from "@/components/ui/button";
import { fetchThreadSummaryApi } from "@/lib/inbox/client-api";
import type { AiSummary, SuggestedAction } from "@/lib/schemas/domain";
import type { AiProvider } from "@/lib/ai/providers";
import type { Thread } from "@/lib/types";

interface ThreadSummaryBoxProps {
  thread: Thread | null;
  provider: AiProvider;
  onAction: (action: SuggestedAction) => void;
}

export function ThreadSummaryBox({ thread, provider, onAction }: ThreadSummaryBoxProps) {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setExpanded(false);
    setSummary(null);
    setError(null);
    setLoading(false);
  }, [thread?.id]);

  useEffect(() => {
    if (!thread || !expanded) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchThreadSummaryApi(thread.id, thread.messages.length, provider)
      .then((result) => {
        if (cancelled) return;
        setSummary(result.summary);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Summary unavailable");
        setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [thread?.id, thread?.messages.length, provider, reloadKey, expanded, thread]);

  if (!thread) return null;

  return (
    <div className="mx-4 mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-600/80" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/90 dark:text-amber-200/90">
            AI summary
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => {
            if (!expanded) {
              setExpanded(true);
              return;
            }
            setExpanded(false);
          }}
        >
          {!expanded ? (
            <>
              <Sparkles className="h-3 w-3" />
              Summarize
            </>
          ) : (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide
            </>
          )}
        </Button>
      </div>

      {!expanded && (
        <p className="mt-2 text-xs text-muted-foreground">
          Get a quick summary and suggested next steps for this thread.
        </p>
      )}

      {expanded && loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Summarizing thread…
        </div>
      )}

      {expanded && error && !loading && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try again
          </Button>
        </div>
      )}

      {expanded && summary && !loading && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-1.5 text-sm text-foreground/90">
            {summary.bullets.map((bullet, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          {summary.actions.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Suggested next steps
              </p>
              <ActionChips actions={summary.actions} onAction={onAction} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
