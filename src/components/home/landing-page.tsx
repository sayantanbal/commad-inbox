"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Keyboard, Sparkles, Zap } from "lucide-react";
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
    description: "Press M on any thread. Availability appears inline. Invite sent in ~3 seconds.",
  },
  {
    icon: Sparkles,
    title: "AI triage lanes",
    description: "Reply, Schedule, FYI, Done — your inbox sorted before you open it.",
  },
  {
    icon: Zap,
    title: "Sub-second search",
    description: "Semantic search across your entire history. Find anything with /.",
  },
];

interface LandingPageProps {
  isSignedIn?: boolean;
}

export function LandingPage({ isSignedIn = false }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-lg font-semibold tracking-tight">
          Command<span className="text-primary">Inbox</span>
        </span>
        <div className="flex items-center gap-3">
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
                <Link href="/sign-in">
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-16 md:px-12 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Keyboard-first · Scheduling-centric
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            Your inbox is a
            <br />
            <span className="text-primary">meeting pipeline</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Command Inbox merges Gmail and Google Calendar into one surface. Every email is
            either a reply, a meeting, or noise — and scheduling takes one keystroke.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="gap-2 px-8">
              <Link href={isSignedIn ? "/inbox" : "/sign-in"}>
                {isSignedIn ? "Open inbox" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">M</kbd>
              {" "}email → meeting in ~3 seconds
            </p>
          </div>
        </motion.div>

        {/* Hero workflow demo strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 max-w-3xl rounded-xl border border-border bg-card/50 p-1 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-lg bg-secondary/40 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-muted-foreground">commandinbox.app/inbox</span>
          </div>
          <div className="grid grid-cols-3 gap-px p-px">
            {["Reply", "Schedule", "FYI"].map((lane, i) => (
              <div
                key={lane}
                className={`px-3 py-2 text-center text-xs font-medium ${
                  i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {lane}
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <p className="text-sm font-medium">Q2 strategy sync — does Tuesday 2pm work?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Press <kbd className="rounded border border-border px-1 font-mono">M</kbd> → pick
              slot → invite sent + draft reply queued
            </p>
          </div>
        </motion.div>

        <ShortcutReference />

        <div className="mt-24 grid gap-6 sm:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="rounded-lg border border-border bg-card/30 p-6"
            >
              <feature.icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Built for consultants whose inbox is their meeting pipeline.
      </footer>
    </div>
  );
}
