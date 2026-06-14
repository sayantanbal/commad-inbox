"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiProviderSelect } from "@/components/inbox/ai-provider-select";
import { useAiProvider } from "@/hooks/use-ai-provider";
import type { SearchHit } from "@/lib/search/semantic";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectThread: (threadId: string) => void;
}

export function SearchOverlay({ open, onOpenChange, onSelectThread }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { provider, setProvider, availableProviders } = useAiProvider();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, provider }),
        });
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = (await response.json()) as { results: SearchHit[] };
        setResults(data.results);
      } catch {
        setError("Could not search. Check your API key and backfill status.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, provider]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4 text-primary" />
            Semantic search
          </DialogTitle>
        </DialogHeader>
        <div className="border-b border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <AiProviderSelect
              value={provider}
              onChange={setProvider}
              availableProviders={availableProviders}
            />
            <span className="text-[10px] text-muted-foreground">
              Switching re-indexes search in the background
            </span>
          </div>
          <Input
            autoFocus
            placeholder="Search your inbox…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="max-h-80">
          <div className="p-2">
            {loading ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">Searching…</p>
            ) : null}
            {error ? <p className="px-2 py-4 text-sm text-destructive">{error}</p> : null}
            {!loading && !error && query.trim().length < 2 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                Type at least 2 characters. Search covers classified threads from backfill.
              </p>
            ) : null}
            {results.map((hit) => (
              <button
                key={hit.threadId}
                type="button"
                className="w-full rounded-md px-3 py-2 text-left hover:bg-secondary/60"
                onClick={() => {
                  onSelectThread(hit.threadId);
                  onOpenChange(false);
                }}
              >
                <p className="text-sm font-medium">{hit.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {hit.sender} · {hit.lane} · {hit.priority}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
