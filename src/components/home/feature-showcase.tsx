"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  mockContacts,
  mockPreBrief,
  mockSendTime,
  mockSnippetResult,
  mockWaitingFor,
} from "@/components/home/mock/demo-data";

const tabs = [
  { id: "commitments", label: "Commitments", key: "W" },
  { id: "prebrief", label: "Pre-Brief", key: "B" },
  { id: "people", label: "People", key: null },
  { id: "focus", label: "Focus", key: null },
  { id: "export", label: "Export", key: "T" },
  { id: "snippets", label: "Snippets", key: "//" },
  { id: "sendtime", label: "Send time", key: null },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function FeatureShowcase() {
  const [active, setActive] = useState<TabId>("commitments");
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [preBriefOpen, setPreBriefOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [focusOn, setFocusOn] = useState(false);
  const [snippetText, setSnippetText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        setActive("commitments");
        setWaitingOpen(true);
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setActive("prebrief");
        setPreBriefOpen(true);
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        setActive("export");
        setExportOpen(true);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1080px]">
        <p className="text-[15px] font-semibold tracking-tight text-primary">Workflow intelligence</p>
        <h2 className="mt-3 max-w-2xl text-[2rem] font-semibold leading-tight tracking-[-0.025em] md:text-[2.75rem]">
          Seven features Superhuman won&apos;t build.
        </h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Try the shortcuts in each tab — <kbd className="rounded border px-1 font-mono text-sm">W</kbd>,{" "}
          <kbd className="rounded border px-1 font-mono text-sm">B</kbd>,{" "}
          <kbd className="rounded border px-1 font-mono text-sm">T</kbd> work in this demo.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active === tab.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.key && (
                <kbd className="ml-1.5 rounded border border-current/30 px-1 font-mono text-[10px]">
                  {tab.key}
                </kbd>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card product-shadow">
          {active === "commitments" && (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Waiting For</h3>
                <Button size="sm" variant="outline" onClick={() => setWaitingOpen((v) => !v)}>
                  Press W
                </Button>
              </div>
              {waitingOpen ? (
                <ul className="mt-4 space-y-3">
                  {mockWaitingFor.map((item) => (
                    <li key={item.id} className="rounded-md border border-border p-3 text-sm">
                      <p className="font-medium">{item.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.counterparty}
                        {item.due ? ` · due ${item.due}` : ""}
                      </p>
                      <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs">
                        Queue follow-up draft
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Press W or the button to open Waiting For.</p>
              )}
            </div>
          )}

          {active === "prebrief" && (
            <div className="p-6">
              <Button size="sm" variant="outline" onClick={() => setPreBriefOpen(true)}>
                Press B — Pre-brief
              </Button>
              {preBriefOpen && (
                <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold">{mockPreBrief.attendee}</p>
                  <p className="mt-2 text-muted-foreground">{mockPreBrief.tone}</p>
                  <ul className="mt-3 space-y-1 text-xs">
                    {mockPreBrief.threads.map((t) => (
                      <li key={t.subject}>
                        <span className="font-medium">{t.subject}</span> — {t.snippet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {active === "people" && (
            <div className="divide-y divide-border">
              {mockContacts.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-3 text-left hover:bg-secondary/50"
                  onClick={() => setSelectedContact(c.email)}
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs capitalize",
                      c.warmth === "cold" && "bg-sky-100 text-sky-800",
                      c.warmth === "active" && "bg-emerald-50 text-emerald-800",
                      c.warmth === "warm" && "bg-amber-50 text-amber-800"
                    )}
                  >
                    {c.warmth}
                  </span>
                </button>
              ))}
              {selectedContact && (
                <p className="px-6 py-3 text-xs text-muted-foreground">
                  Alert: You haven&apos;t replied to {selectedContact.split("@")[0]} in 3 weeks.
                </p>
              )}
            </div>
          )}

          {active === "focus" && (
            <div className="p-6">
              <p className="text-sm text-muted-foreground">Batch windows: 9am · 1pm · 5pm</p>
              <Button
                className="mt-4"
                variant={focusOn ? "default" : "outline"}
                onClick={() => setFocusOn((v) => !v)}
              >
                {focusOn ? "Focus active — notifications muted" : "Start focus block"}
              </Button>
              {focusOn && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Auto-reply sent once per sender: &quot;I check email at 9am, 1pm, and 5pm…&quot;
                </p>
              )}
            </div>
          )}

          {active === "export" && (
            <div className="p-6">
              <Button size="sm" onClick={() => setExportOpen(true)}>
                Press T — Export to Linear
              </Button>
              {exportOpen && (
                <div className="mt-4 rounded-md border border-border p-4 text-sm">
                  <p className="font-medium">Q2 strategy sync — follow up</p>
                  <p className="mt-2 text-xs text-muted-foreground">Notion · GitHub — coming soon</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setExportDone(true);
                      setExportOpen(false);
                    }}
                  >
                    Create in Linear
                  </Button>
                </div>
              )}
              {exportDone && (
                <p className="mt-3 text-sm text-primary">Issue created — link copied.</p>
              )}
            </div>
          )}

          {active === "snippets" && (
            <div className="p-6">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Type //follow in composer…"
                value={snippetText}
                onChange={(e) => {
                  const v = e.target.value;
                  setSnippetText(v);
                  if (v.includes("//follow")) {
                    setSnippetText("");
                  }
                }}
              />
              <div
                className="mt-3 rounded-md border border-border bg-secondary/30 p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: mockSnippetResult }}
              />
            </div>
          )}

          {active === "sendtime" && (
            <div className="p-6">
              <p className="text-sm font-medium">Send later</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Tonight 8pm
                </span>
                <span className="rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                  {mockSendTime.suggested} ✓
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{mockSendTime.reason}</p>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-2xl font-semibold tracking-tight">
          $15<span className="text-lg font-normal text-muted-foreground">/mo</span>
          <span className="ml-3 text-base font-normal text-muted-foreground line-through">Superhuman $30</span>
        </p>
      </div>
    </section>
  );
}
