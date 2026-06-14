"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  featureTabCopy,
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

const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const itemMotion = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
};

export function FeatureShowcase() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<TabId>("commitments");
  const [phase, setPhase] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [waitingOpen, setWaitingOpen] = useState(false);
  const [preBriefOpen, setPreBriefOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [focusOn, setFocusOn] = useState(false);
  const [snippetText, setSnippetText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [sendTimeHighlight, setSendTimeHighlight] = useState(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const resetDemoState = useCallback(() => {
    setPhase(0);
    setWaitingOpen(false);
    setPreBriefOpen(false);
    setExportOpen(false);
    setExportDone(false);
    setFocusOn(false);
    setSnippetText("");
    setSelectedContact(null);
    setSendTimeHighlight(false);
  }, []);

  const runDemo = useCallback(
    (tab: TabId) => {
      clearTimers();
      resetDemoState();

      if (reduceMotion) {
        switch (tab) {
          case "commitments":
            setWaitingOpen(true);
            break;
          case "prebrief":
            setPreBriefOpen(true);
            break;
          case "people":
            setSelectedContact(mockContacts[0]?.email ?? null);
            break;
          case "focus":
            setFocusOn(true);
            break;
          case "export":
            setExportDone(true);
            break;
          case "snippets":
            setSnippetText("//follow");
            break;
          case "sendtime":
            setSendTimeHighlight(true);
            break;
        }
        return;
      }

      switch (tab) {
        case "commitments":
          schedule(() => setPhase(1), 400);
          schedule(() => {
            setWaitingOpen(true);
            setPhase(2);
          }, 900);
          break;
        case "prebrief":
          schedule(() => setPhase(1), 400);
          schedule(() => {
            setPreBriefOpen(true);
            setPhase(2);
          }, 900);
          break;
        case "people":
          schedule(() => setPhase(1), 500);
          schedule(() => {
            setSelectedContact(mockContacts[0]?.email ?? null);
            setPhase(2);
          }, 1400);
          break;
        case "focus":
          schedule(() => setPhase(1), 500);
          schedule(() => {
            setFocusOn(true);
            setPhase(2);
          }, 1100);
          break;
        case "export":
          schedule(() => {
            setExportOpen(true);
            setPhase(1);
          }, 500);
          schedule(() => {
            setExportDone(true);
            setExportOpen(false);
            setPhase(2);
          }, 1800);
          break;
        case "snippets":
          schedule(() => setSnippetText("//f"), 300);
          schedule(() => setSnippetText("//fo"), 550);
          schedule(() => setSnippetText("//fol"), 800);
          schedule(() => setSnippetText("//follow"), 1050);
          schedule(() => {
            setSnippetText("");
            setPhase(1);
          }, 1500);
          break;
        case "sendtime":
          schedule(() => setPhase(1), 400);
          schedule(() => {
            setSendTimeHighlight(true);
            setPhase(2);
          }, 1000);
          break;
      }
    },
    [clearTimers, reduceMotion, resetDemoState, schedule]
  );

  const selectTab = useCallback(
    (tab: TabId) => {
      setActive(tab);
      runDemo(tab);
    },
    [runDemo]
  );

  useEffect(() => {
    runDemo("commitments");
    return clearTimers;
  }, [clearTimers, runDemo]);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        selectTab("commitments");
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        selectTab("prebrief");
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        selectTab("export");
      }
    },
    [selectTab]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const activeDescription = featureTabCopy[active]?.description ?? "";

  const motionProps = reduceMotion ? {} : panelMotion;

  return (
    <div className="px-6 py-10 md:py-12">
      <p className="text-[15px] font-semibold tracking-tight text-primary">Workflow intelligence</p>
      <h2 className="mt-3 max-w-4xl text-[2rem] font-semibold leading-tight tracking-[-0.025em] md:text-[2.75rem]">
        Command Inbox remembers what email apps forget.
      </h2>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Try the shortcuts in each tab —{" "}
        <kbd className="rounded border px-1 font-mono text-sm">W</kbd>,{" "}
        <kbd className="rounded border px-1 font-mono text-sm">B</kbd>,{" "}
        <kbd className="rounded border px-1 font-mono text-sm">T</kbd> work in this demo.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
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

      <AnimatePresence mode="wait">
        <motion.p
          key={active}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          {activeDescription}
        </motion.p>
      </AnimatePresence>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        <AnimatePresence mode="wait">
          {active === "commitments" && (
            <motion.div key="commitments" {...motionProps} className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Waiting For</h3>
                <motion.div
                  animate={
                    reduceMotion || phase >= 1
                      ? { scale: 1, boxShadow: "0 0 0 0 rgba(0,102,204,0)" }
                      : { scale: [1, 1.04, 1], boxShadow: "0 0 0 4px rgba(0,102,204,0.15)" }
                  }
                  transition={{ duration: 0.6, repeat: phase === 0 ? Infinity : 0, repeatDelay: 1.2 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setWaitingOpen(true);
                      setPhase(2);
                    }}
                  >
                    Press W
                  </Button>
                </motion.div>
              </div>
              <AnimatePresence>
                {waitingOpen ? (
                  <motion.ul
                    className="mt-4 space-y-3"
                    {...(reduceMotion ? {} : stagger)}
                    initial="initial"
                    animate="animate"
                  >
                    {mockWaitingFor.map((item) => (
                      <motion.li
                        key={item.id}
                        {...(reduceMotion ? {} : itemMotion)}
                        className="rounded-md border border-border p-3 text-sm"
                      >
                        <p className="font-medium">{item.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.counterparty}
                          {item.due ? ` · due ${item.due}` : ""}
                        </p>
                        <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs">
                          Queue follow-up draft
                        </Button>
                      </motion.li>
                    ))}
                  </motion.ul>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-sm text-muted-foreground"
                  >
                    Press W or the button to open Waiting For.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {active === "prebrief" && (
            <motion.div key="prebrief" {...motionProps} className="p-6">
              <motion.div
                animate={
                  reduceMotion || preBriefOpen
                    ? {}
                    : { scale: [1, 1.03, 1] }
                }
                transition={{ duration: 0.5, repeat: phase === 0 ? Infinity : 0, repeatDelay: 1 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPreBriefOpen(true);
                    setPhase(2);
                  }}
                >
                  Press B — Pre-brief
                </Button>
              </motion.div>
              <AnimatePresence>
                {preBriefOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden rounded-md border border-primary/20 bg-primary/5 p-4 text-sm"
                  >
                    <p className="font-semibold">{mockPreBrief.attendee}</p>
                    <p className="mt-2 text-muted-foreground">{mockPreBrief.tone}</p>
                    <motion.ul
                      className="mt-3 space-y-1 text-xs"
                      {...(reduceMotion ? {} : stagger)}
                      initial="initial"
                      animate="animate"
                    >
                      {mockPreBrief.threads.map((t) => (
                        <motion.li key={t.subject} {...(reduceMotion ? {} : itemMotion)}>
                          <span className="font-medium">{t.subject}</span> — {t.snippet}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {active === "people" && (
            <motion.div key="people" {...motionProps} className="divide-y divide-border">
              {mockContacts.map((c, i) => (
                <motion.button
                  key={c.email}
                  type="button"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "flex w-full items-center justify-between px-6 py-3 text-left hover:bg-secondary/50",
                    selectedContact === c.email && "bg-secondary/40"
                  )}
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
                </motion.button>
              ))}
              <AnimatePresence>
                {selectedContact && (
                  <motion.p
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 py-3 text-xs text-muted-foreground"
                  >
                    Alert: You haven&apos;t replied to {selectedContact.split("@")[0]} in 3 weeks.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {active === "focus" && (
            <motion.div key="focus" {...motionProps} className="p-6">
              <p className="text-sm text-muted-foreground">Batch windows: 9am · 1pm · 5pm</p>
              <Button
                className="mt-4"
                variant={focusOn ? "default" : "outline"}
                onClick={() => {
                  setFocusOn((v) => !v);
                  setPhase(2);
                }}
              >
                {focusOn ? "Focus active — notifications muted" : "Start focus block"}
              </Button>
              <AnimatePresence>
                {focusOn && (
                  <motion.p
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-xs text-muted-foreground"
                  >
                    Auto-reply sent once per sender: &quot;I check email at 9am, 1pm, and 5pm…&quot;
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {active === "export" && (
            <motion.div key="export" {...motionProps} className="p-6">
              <Button
                size="sm"
                onClick={() => {
                  setExportOpen(true);
                  setPhase(1);
                }}
              >
                Press T — Export to Linear
              </Button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="mt-4 rounded-md border border-border p-4 text-sm"
                  >
                    <p className="font-medium">Q2 strategy sync — follow up</p>
                    <p className="mt-2 text-xs text-muted-foreground">Notion · GitHub — coming soon</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setExportDone(true);
                        setExportOpen(false);
                        setPhase(2);
                      }}
                    >
                      Create in Linear
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {exportDone && (
                  <motion.p
                    initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-3 text-sm text-primary"
                  >
                    Issue created — link copied.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {active === "snippets" && (
            <motion.div key="snippets" {...motionProps} className="p-6">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Type //follow in composer…"
                value={snippetText}
                onChange={(e) => setSnippetText(e.target.value)}
              />
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: phase >= 1 || snippetText === "" ? 1 : 0.4, y: 0 }}
                className="mt-3 rounded-md border border-border bg-secondary/30 p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: mockSnippetResult }}
              />
            </motion.div>
          )}

          {active === "sendtime" && (
            <motion.div key="sendtime" {...motionProps} className="p-6">
              <p className="text-sm font-medium">Send later</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  Tonight 8pm
                </span>
                <motion.span
                  animate={
                    sendTimeHighlight && !reduceMotion
                      ? { scale: [1, 1.04, 1], boxShadow: "0 0 0 3px rgba(0,102,204,0.2)" }
                      : {}
                  }
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium",
                    sendTimeHighlight
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {mockSendTime.suggested} {sendTimeHighlight ? "✓" : ""}
                </motion.span>
              </div>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: sendTimeHighlight ? 1 : 0.5 }}
                className="mt-2 text-xs text-muted-foreground"
              >
                {mockSendTime.reason}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-8 text-center text-2xl font-semibold tracking-tight">
        $15<span className="text-lg font-normal text-muted-foreground">/mo</span>
      </p>
    </div>
  );
}
