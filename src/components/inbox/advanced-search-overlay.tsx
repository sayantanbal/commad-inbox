"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { SearchHit } from "@/lib/search/semantic";
import type { TriageLane } from "@/lib/types";

interface AdvancedSearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectThread: (threadId: string) => void;
}

const LANES: Array<{ value: TriageLane | ""; label: string }> = [
  { value: "", label: "Any lane" },
  { value: "reply", label: "Reply" },
  { value: "schedule", label: "Schedule" },
  { value: "fyi", label: "FYI" },
  { value: "done", label: "Done" },
];

export function AdvancedSearchOverlay({
  open,
  onOpenChange,
  onSelectThread,
}: AdvancedSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [lane, setLane] = useState<TriageLane | "">("");
  const [hasAttachment, setHasAttachment] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const reset = () => {
    setQuery("");
    setSender("");
    setAfter("");
    setBefore("");
    setLane("");
    setHasAttachment(false);
    setResults([]);
    setError(null);
    setSearched(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const body: Record<string, unknown> = {};
      if (query.trim()) body.query = query.trim();
      if (sender.trim()) body.sender = sender.trim();
      if (after) body.after = new Date(after).toISOString();
      if (before) body.before = new Date(before).toISOString();
      if (lane) body.lane = lane;
      if (hasAttachment) body.hasAttachment = true;

      const response = await fetch("/api/search/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = (await response.json()) as { results: SearchHit[] };
      setResults(data.results);
    } catch {
      setError("Advanced search failed. Check your Gmail connection.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-primary" />
            Advanced search
            <span className="text-[10px] font-normal text-muted-foreground">Corsair · Gmail API</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 border-b border-border px-4 py-3">
          <Input
            autoFocus
            placeholder="Keywords (Gmail search syntax)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="From (email or name)"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="h-9"
            />
            <select
              value={lane}
              onChange={(e) => setLane(e.target.value as TriageLane | "")}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              {LANES.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              className="h-9"
              aria-label="After date"
            />
            <Input
              type="date"
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              className="h-9"
              aria-label="Before date"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={hasAttachment}
              onChange={(e) => setHasAttachment(e.target.checked)}
              className="rounded border-border"
            />
            Has attachment
          </label>
          <Button size="sm" className="w-full gap-2" onClick={() => void handleSearch()} disabled={loading}>
            <Search className="h-3.5 w-3.5" />
            {loading ? "Searching…" : "Search Gmail"}
          </Button>
        </div>

        <ScrollArea className="max-h-80">
          <div className="p-2">
            {error ? <p className="px-2 py-4 text-sm text-destructive">{error}</p> : null}
            {!loading && searched && !error && results.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">No threads matched your filters.</p>
            ) : null}
            {!searched && !loading ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                Search all Gmail history via Corsair — not limited to classified backfill threads.
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
