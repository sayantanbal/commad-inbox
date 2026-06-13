"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, Keyboard, Search, Sparkles } from "lucide-react";
import { ShortcutReference } from "@/components/home/shortcut-reference";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Keyboard,
    title: "One keystroke workflows",
    description: "Archive, reply, schedule — every action on a single key. No mouse required.",
  },
  {
    icon: Calendar,
    title: "Email meets calendar",
    description: "Press M on any thread. Availability appears inline. Invite sent in about three seconds.",
  },
  {
    icon: Sparkles,
    title: "AI triage lanes",
    description: "Reply, Schedule, FYI, Done — your inbox sorted before you open it.",
  },
  {
    icon: Search,
    title: "Sub-second search",
    description: "Semantic search across your entire history. Find anything with a single slash.",
  },
];

const flow = [
  { step: "01", key: "J / K", label: "Move through the lane", detail: "Reply, Schedule, FYI — sorted on arrival." },
  { step: "02", key: "M", label: "Open availability", detail: "Your free slots, read straight from Calendar." },
  { step: "03", key: "↵", label: "Pick a time", detail: "Invite created with a Meet link attached." },
  { step: "04", key: "Sent", label: "Draft reply queued", detail: "Confirmation written, waiting on your send." },
];

interface LandingPageProps {
  isSignedIn?: boolean;
}

export function LandingPage({ isSignedIn = false }: LandingPageProps) {
  const reduceMotion = useReducedMotion();
  const rise = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Global nav — thin hairline-bottom bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-[1080px] items-center justify-between px-6">
          <span className="text-[15px] font-semibold tracking-tight">
            Command<span className="text-primary">Inbox</span>
          </span>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <Button size="sm" asChild>
                <Link href="/inbox">
                  Open inbox
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-in">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero tile (white) */}
      <section className="px-6 pb-4 pt-20 md:pt-28">
        <div className="mx-auto max-w-[1080px] text-center">
          <motion.p
            {...rise(0)}
            className="text-[15px] font-semibold tracking-tight text-primary"
          >
            Keyboard-first · Scheduling-centric
          </motion.p>
          <motion.h1
            {...rise(0.05)}
            className="mx-auto mt-3 max-w-3xl text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[3.5rem]"
          >
            Your inbox is a
            <br className="hidden sm:block" /> meeting pipeline.
          </motion.h1>
          <motion.p
            {...rise(0.1)}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-[21px]"
          >
            Command Inbox merges Gmail and Google Calendar into one surface. Every email is a reply,
            a meeting, or noise — and scheduling takes a single keystroke.
          </motion.p>

          <motion.div
            {...rise(0.15)}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" asChild className="px-7">
              <Link href={isSignedIn ? "/inbox" : "/sign-in"}>
                {isSignedIn ? "Open inbox" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Press{" "}
              <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                M
              </kbd>{" "}
              — email to meeting in ~3 seconds
            </p>
          </motion.div>
        </div>

        {/* Signature: the product resting on a surface, with the single system shadow */}
        <motion.div
          {...rise(0.22)}
          className="mx-auto mt-16 max-w-[1000px] px-2"
        >
          <InboxRender />
        </motion.div>
      </section>

      {/* Dark editorial tile — the real keystroke sequence */}
      <section className="mt-24 bg-tile-dark px-6 py-24 text-white">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-[15px] font-semibold tracking-tight text-on-dark-link">The hero workflow</p>
          <h2 className="mt-3 max-w-2xl text-[2rem] font-semibold leading-tight tracking-[-0.025em] md:text-[2.75rem]">
            One keystroke, start to sent.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/65">
            A scheduling email shouldn&apos;t take five tabs. Here is the whole path, key by key.
          </p>

          <ol className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item) => (
              <li key={item.step} className="border-t border-white/15 pt-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-white/40">{item.step}</span>
                  <kbd className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-xs text-white">
                    {item.key}
                  </kbd>
                </div>
                <p className="mt-3 text-[17px] font-semibold tracking-tight">{item.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{item.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Capability tiles (white) */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1080px]">
          <h2 className="max-w-xl text-[2rem] font-semibold leading-tight tracking-[-0.025em] md:text-[2.5rem]">
            Built for people who live in their inbox.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card p-8">
                <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                <h3 className="mt-4 text-[17px] font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shortcuts (parchment) */}
      <section className="bg-parchment px-6 py-24">
        <div className="mx-auto max-w-[1080px]">
          <ShortcutReference />
        </div>
      </section>

      {/* Closing CTA + footer (parchment) */}
      <footer className="bg-parchment px-6 pb-16">
        <div className="mx-auto max-w-[1080px] border-t border-border pt-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[17px] font-semibold tracking-tight">
                Command<span className="text-primary">Inbox</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Built for consultants whose inbox is their meeting pipeline.
              </p>
            </div>
            <Button asChild>
              <Link href={isSignedIn ? "/inbox" : "/sign-in"}>
                {isSignedIn ? "Open inbox" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-10 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Command Inbox
          </p>
        </div>
      </footer>
    </div>
  );
}

/* A crisp, themed render of the inbox resting on a surface — the one place the system shadow appears. */
function InboxRender() {
  const lanes = [
    { name: "Reply", count: 4, active: false },
    { name: "Schedule", count: 2, active: true },
    { name: "FYI", count: 7, active: false },
  ];
  const threads = [
    { sender: "Dana Whitfield", subject: "Q2 strategy sync — does Tuesday 2pm work?", priority: "High", selected: true },
    { sender: "Priya Nair", subject: "Re: contract redlines for review", priority: "Med", selected: false },
    { sender: "Acme Procurement", subject: "Vendor onboarding next steps", priority: "Low", selected: false },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card product-shadow">
      {/* Window bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-[13px] font-semibold tracking-tight">
          Command<span className="text-primary">Inbox</span>
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono">⌘K</kbd>
          Commands
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_0.9fr]">
        {/* Lanes + list */}
        <div className="border-b border-border md:border-b-0 md:border-r">
          <div className="flex border-b border-border">
            {lanes.map((lane) => (
              <div
                key={lane.name}
                className={`flex-1 px-3 py-2.5 text-center text-[11px] font-medium ${
                  lane.active
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {lane.name}{" "}
                <span className={lane.active ? "text-primary/70" : "text-muted-foreground/70"}>
                  {lane.count}
                </span>
              </div>
            ))}
          </div>
          <div>
            {threads.map((t) => (
              <div
                key={t.sender}
                className={`border-b border-border px-3 py-2.5 ${t.selected ? "bg-secondary" : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  {t.selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  <span className="truncate text-[13px] font-semibold">{t.sender}</span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{t.subject}</p>
                <span
                  className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    t.priority === "High"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Thread + action bar */}
        <div className="hidden flex-col md:flex">
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
            {[
              { label: "Reply", k: "R" },
              { label: "Archive", k: "E" },
              { label: "Meeting", k: "M" },
              { label: "Snooze", k: "S" },
            ].map((a) => (
              <span key={a.k} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1">
                {a.label}
                <kbd className="rounded border border-border bg-secondary px-1 font-mono text-[9px]">
                  {a.k}
                </kbd>
              </span>
            ))}
          </div>
          <div className="px-4 py-3">
            <p className="text-[14px] font-semibold tracking-tight">
              Q2 strategy sync — does Tuesday 2pm work?
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Dana Whitfield</p>
            <p className="mt-3 text-[12px] leading-relaxed text-foreground/80">
              Hi — could we grab 30 minutes early next week to align on the Q2 roadmap? Tuesday
              afternoon works well on my end if that suits you.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <span className="text-[11px] text-foreground">Tue · 2:00 PM — 2:30 PM</span>
              <kbd className="rounded border border-primary/30 bg-card px-1 font-mono text-[9px] text-primary">
                ↵
              </kbd>
            </div>
          </div>
        </div>

        {/* Mini calendar */}
        <div className="hidden border-l border-border md:block">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground">calendar</p>
            <p className="text-[13px] font-semibold tracking-tight">This week</p>
          </div>
          <div className="space-y-1.5 p-3">
            {[
              { day: "Mon", evt: "Free", muted: true },
              { day: "Tue", evt: "Q2 strategy sync · 2:00 PM", muted: false },
              { day: "Wed", evt: "1:1 · 11:00 AM", muted: false },
            ].map((d) => (
              <div key={d.day}>
                <p className="text-[11px] font-medium text-muted-foreground">{d.day}</p>
                <div
                  className={`mt-0.5 rounded-md px-2 py-1.5 text-[11px] ${
                    d.muted
                      ? "text-muted-foreground/60"
                      : "border border-border bg-secondary text-foreground"
                  }`}
                >
                  {d.evt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
