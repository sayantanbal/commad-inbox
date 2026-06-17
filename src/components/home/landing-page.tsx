"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { FeatureShowcase } from "@/components/home/feature-showcase";
import {
  mockCommitmentSetupSteps,
  mockWorkingDaysText,
  schedulingDurations,
  type SchedulingDuration,
} from "@/components/home/mock/demo-data";

interface LandingPageProps {
  isSignedIn?: boolean;
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function LandingPage({ isSignedIn = false }: LandingPageProps) {
  const reduceMotion = useReducedMotion();

  const rise = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease },
        };

  const inView = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.55, delay, ease },
        };

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-40 bg-surface-black text-on-dark backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-black/90">
        <div className="mx-auto flex h-11 max-w-[1080px] items-center justify-between px-6">
          <Link href="/" className="type-body-strong text-on-dark">
            Command Inbox
          </Link>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="type-nav-link text-on-dark/72 hover:text-on-dark transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/sign-in"
              className="type-nav-link text-on-dark/72 hover:text-on-dark transition-colors"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="ml-2">
              <Link href={isSignedIn ? "/inbox" : "/sign-in"}>
                {isSignedIn ? "Open inbox" : "Get early access"}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="bg-parchment">
        <div className="mx-auto max-w-[1080px] px-6 py-20 text-center">
          <motion.p
            {...rise(0)}
            className="type-caption-strong text-primary uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            Keyboard-first email
          </motion.p>
          <motion.h1
            {...rise(0.05)}
            className="mx-auto mt-4 max-w-3xl type-display-lg text-ink"
            style={{ fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1.05 }}
          >
            Your inbox, finally working for you.
          </motion.h1>
          <motion.p
            {...rise(0.1)}
            className="mx-auto mt-5 max-w-[480px] type-body text-ink-muted-48"
          >
            Command Inbox turns Gmail and Calendar into a keyboard-driven workspace.
            Commitments tracked. Meetings booked. Zero dropped balls.
          </motion.p>

          <motion.div
            {...rise(0.15)}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg">
              <Link href={isSignedIn ? "/inbox" : "/sign-in"}>
                {isSignedIn ? "Open inbox" : "Get early access"}
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
            <Button asChild variant="secondary-pill" size="lg">
              <a href="#features">See it in action</a>
            </Button>
          </motion.div>

          <motion.div
            {...rise(0.22)}
            className="mx-auto mt-16 max-w-[1000px] overflow-hidden rounded-[18px] border border-hairline bg-canvas product-shadow"
          >
            <FeatureShowcase />
          </motion.div>
        </div>
      </section>

      <section id="features" className="bg-background">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <motion.div {...inView(0)}>
            <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
              Commitments
            </p>
            <h2 className="mt-4 type-display-md text-ink">
              Every commitment.<br />Nothing lost.
            </h2>
            <p className="mt-5 type-body text-ink-muted-48 max-w-md">
              AI reads every thread and extracts what you&apos;ve promised, what
              you&apos;re waiting for, and what&apos;s overdue. Press{" "}
              <KbdBadge>W</KbdBadge> to see your follow-ups in one view.
            </p>
            <div className="mt-6 flex items-center gap-4 text-ink-muted-80">
              <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <span className="type-caption">Due dates inferred from context</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-ink-muted-80">
              <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <span className="type-caption">Status updates as threads progress</span>
            </div>

            <div className="mt-8">
              <p className="type-caption-strong text-ink uppercase" style={{ letterSpacing: "0.06em" }}>
                How to set up
              </p>
              <ol className="mt-4 space-y-4">
                {mockCommitmentSetupSteps.map((step, i) => (
                  <motion.li
                    key={step.step}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0, x: -12 },
                          whileInView: { opacity: 1, x: 0 },
                          viewport: { once: true },
                          transition: { delay: 0.15 + i * 0.1, duration: 0.4, ease },
                        })}
                    className="flex gap-3"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 type-fine text-primary">
                      {step.step}
                    </span>
                    <div>
                      <p className="type-body-strong text-ink">{step.title}</p>
                      <p className="type-caption text-ink-muted-48">{step.detail}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
          <motion.div {...inView(0.1)}>
            <MockCommitments reduceMotion={!!reduceMotion} />
          </motion.div>
        </div>
      </section>

      <section className="bg-parchment">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <motion.div {...inView(0)}>
            <MockAvailability reduceMotion={!!reduceMotion} />
          </motion.div>
          <motion.div {...inView(0.1)}>
            <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
              Scheduling
            </p>
            <h2 className="mt-4 type-display-md text-ink">
              Your week,<br />one keystroke away.
            </h2>
            <p className="mt-5 type-body text-ink-muted-48 max-w-md">
              Press <KbdBadge>M</KbdBadge> on any thread. See your true availability
              from Calendar, pick a 30, 45, or 60-minute window, and the invite + reply
              draft are queued in seconds.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <motion.div {...inView(0)}>
            <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
              Working days
            </p>
            <h2 className="mt-4 type-display-md text-ink">
              Describe your week<br />in plain English.
            </h2>
            <p className="mt-5 type-body text-ink-muted-48 max-w-md">
              Tell us when you work — early meetings, half-day Fridays, lunch blocks.
              Scheduling slots respect your rules automatically, no rigid grid setup required.
            </p>
            <div className="mt-6 flex items-center gap-3 text-ink-muted-80">
              <CalendarClock className="h-5 w-5 text-primary" strokeWidth={1.75} />
              <span className="type-caption">Structured wizard with optional text override</span>
            </div>
          </motion.div>
          <motion.div {...inView(0.1)}>
            <MockWorkingDays reduceMotion={!!reduceMotion} />
          </motion.div>
        </div>
      </section>

      <section className="bg-tile-dark text-on-dark">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <motion.div {...inView(0)}>
            <p
              className="type-caption-strong uppercase"
              style={{ color: "var(--color-primary-on-dark)", letterSpacing: "0.08em" }}
            >
              Relationships
            </p>
            <h2 className="mt-4 type-display-md text-on-dark">
              Your network,<br />always warm.
            </h2>
            <p className="mt-5 type-body text-on-dark-muted max-w-md">
              Every contact gets a warmth score from real signal — reply latency,
              cadence, open commitments. Spot who&apos;s going cold before you lose them.
            </p>
            <a
              href="#pricing"
              className="mt-6 inline-flex items-center gap-2 type-caption text-on-dark-link hover:underline"
            >
              See how it&apos;s scored
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </motion.div>
          <motion.div {...inView(0.1)}>
            <MockRelationships reduceMotion={!!reduceMotion} />
          </motion.div>
        </div>
      </section>

      <section className="bg-parchment">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <motion.div {...inView(0)}>
            <MockAgent reduceMotion={!!reduceMotion} />
          </motion.div>
          <motion.div {...inView(0.1)}>
            <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
              The agent
            </p>
            <h2 className="mt-4 type-display-md text-ink">
              An agent that waits<br />for your approval.
            </h2>
            <p className="mt-5 type-body text-ink-muted-48 max-w-md">
              Drafts replies, books meetings, exports tasks to Linear — but never
              sends a thing until you say yes. Every action is reviewable.
              Every action is reversible.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="pricing" className="bg-background">
        <motion.div
          {...inView(0)}
          className="mx-auto max-w-[1080px] px-6 py-20"
        >
          <div className="text-center">
            <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
              Pricing
            </p>
            <h2 className="mt-4 type-display-md text-ink">
              Two plans. No surprises.
            </h2>
            <p className="mx-auto mt-4 max-w-md type-body text-ink-muted-48">
              Start free. Upgrade when commitments start piling up.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl gap-6 md:grid-cols-2">
            <motion.div {...inView(0.08)}>
              <PricingCard
                name="Starter"
                price="$0"
                tagline="For personal inboxes."
                features={[
                  "1 Gmail + Calendar account",
                  "AI triage (Reply / Schedule / FYI)",
                  "Keyboard navigation",
                  "30-day history",
                ]}
                ctaLabel="Start free"
                ctaHref={isSignedIn ? "/inbox" : "/sign-in"}
              />
            </motion.div>
            <motion.div {...inView(0.16)}>
              <PricingCard
                highlighted
                name="Pro"
                price="$15"
                priceSuffix="/mo"
                tagline="For consultants who can&rsquo;t drop the ball."
                features={[
                  "Commitment + Waiting For tracker",
                  "Relationship health, daily brief",
                  "Agent with MCP tool approval",
                  "Semantic search, full history",
                ]}
                ctaLabel="Get early access"
                ctaHref={isSignedIn ? "/inbox" : "/sign-in"}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <footer className="bg-parchment border-t border-hairline">
        <div className="mx-auto max-w-[1080px] px-6 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <p className="type-body-strong text-ink">Command Inbox</p>
              <p className="mt-2 type-caption text-ink-muted-48 max-w-[16ch]">
                Commitment tracking for people who live in their inbox.
              </p>
            </div>
            <FooterCol
              heading="Product"
              links={[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Shortcuts", href: "/inbox" },
              ]}
            />
            <FooterCol
              heading="Company"
              links={[
                { label: "About", href: "#" },
                { label: "Contact", href: "#" },
                { label: "Blog", href: "#" },
              ]}
            />
            <FooterCol
              heading="Legal"
              links={[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Security", href: "#" },
              ]}
            />
          </div>
          <div className="mt-12 border-t border-hairline pt-6 type-fine text-ink-muted-48">
            © {new Date().getFullYear()} Command Inbox. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="type-caption-strong text-ink uppercase" style={{ letterSpacing: "0.06em" }}>
        {heading}
      </p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="type-body text-ink-muted-80 hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCard({
  name,
  price,
  priceSuffix,
  tagline,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
}: {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`util-card relative ${highlighted ? "border-primary" : ""}`}
      style={highlighted ? { borderColor: "var(--color-primary)" } : undefined}
    >
      {highlighted && (
        <span
          className="absolute -top-3 left-6 type-fine uppercase rounded-full px-2 py-1"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-on-primary)",
            letterSpacing: "0.08em",
          }}
        >
          Most popular
        </span>
      )}
      <p className="type-tagline text-ink">{name}</p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="type-display-md text-ink" style={{ fontSize: 40 }}>
          {price}
        </span>
        {priceSuffix && (
          <span className="type-body text-ink-muted-48">{priceSuffix}</span>
        )}
      </div>
      <p className="mt-2 type-caption text-ink-muted-48">{tagline}</p>

      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" strokeWidth={1.75} />
            <span className="type-caption text-ink-muted-80">{f}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-8 w-full">
        <Link href={ctaHref}>
          {ctaLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </Button>
    </div>
  );
}

function MockCommitments({ reduceMotion }: { reduceMotion: boolean }) {
  const [phase, setPhase] = useState(0);
  const items = [
    { who: "Marcus Chen", what: "Send proposal v2", due: "Today", status: "due" as const },
    { who: "Anya Müller", what: "Reply with Q3 numbers", due: "Tomorrow", status: "ok" as const },
    { who: "Tom Bradshaw", what: "Confirm contract terms", due: "Overdue · 2d", status: "overdue" as const },
    { who: "Priya Iyer", what: "Schedule pilot kickoff", due: "Fri", status: "ok" as const },
  ];

  useEffect(() => {
    if (reduceMotion) {
      setPhase(2);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduceMotion]);

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas">
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-b border-hairline bg-primary/5 px-5 py-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <p className="type-caption text-ink-muted-80">
                AI extracted 2 commitments from &quot;Re: Q2 strategy sync&quot;
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="border-b border-hairline px-5 py-3 flex items-center justify-between">
        <span className="type-caption-strong text-ink-muted-48 uppercase">My commitments</span>
        <KbdBadge>W</KbdBadge>
      </div>
      <ul className="divide-y divide-[color:var(--color-divider-soft)]">
        {items.map((item, i) => (
          <motion.li
            key={item.what}
            initial={reduceMotion ? false : { opacity: 0, x: -10 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease }}
            className={`px-5 py-4 ${item.status === "overdue" ? "thread-overdue" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="type-body-strong text-ink truncate">{item.what}</p>
              <span
                className={`btn-pearl-capsule type-fine ${
                  item.status === "overdue" ? "text-[color:var(--color-destructive)]" : ""
                }`}
                style={{ padding: "4px 10px" }}
              >
                {item.due}
              </span>
            </div>
            <p className="mt-1 type-caption text-ink-muted-48">From: {item.who}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function MockAvailability({ reduceMotion }: { reduceMotion: boolean }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const [duration, setDuration] = useState<SchedulingDuration>(30);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(2);

  useEffect(() => {
    if (reduceMotion) return;
    let i = 0;
    const cycle = () => {
      const d = schedulingDurations[i % schedulingDurations.length]!;
      setDuration(d);
      setSelectedDay(1 + (i % 3));
      setSelectedSlot(1 + (i % 3));
      i += 1;
    };
    cycle();
    const id = setInterval(cycle, 2200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const endByDuration: Record<SchedulingDuration, string> = {
    30: "2:30 PM",
    45: "2:45 PM",
    60: "3:00 PM",
  };

  const selectedLabel = `${days[selectedDay]} · 2:00–${endByDuration[duration]}`;

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="type-caption-strong text-ink-muted-48 uppercase">
          Pick a {duration}-min window
        </span>
        <KbdBadge>M</KbdBadge>
      </div>

      <div className="mt-3 flex gap-2">
        {schedulingDurations.map((d) => (
          <motion.button
            key={d}
            type="button"
            animate={
              !reduceMotion && duration === d
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.3 }}
            className={cnDurationChip(duration === d)}
            onClick={() => setDuration(d)}
          >
            {d} min
          </motion.button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {days.map((d, di) => (
          <div key={d}>
            <p className="type-caption-strong text-center text-ink-muted-80">{d}</p>
            <div className="mt-2 space-y-1.5">
              {[0, 1, 2, 3].map((si) => {
                const isSelected = di === selectedDay && si === selectedSlot;
                const isAvail = (di + si) % 3 !== 0;
                return (
                  <motion.div
                    key={si}
                    animate={
                      isSelected && !reduceMotion
                        ? { scale: [1, 1.06, 1], opacity: 1 }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={{ duration: 0.35 }}
                    className={`h-7 rounded ${
                      isSelected
                        ? "bg-primary"
                        : isAvail
                          ? "bg-[rgba(0,102,204,0.10)] border-l-2 border-primary"
                          : "bg-[color:var(--color-divider-soft)]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <motion.p
        key={selectedLabel}
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 type-caption text-ink-muted-48"
      >
        Selected:{" "}
        <span className="type-body-strong text-ink">{selectedLabel}</span>
      </motion.p>
    </div>
  );
}

function cnDurationChip(active: boolean) {
  return [
    "rounded-full px-3 py-1 type-caption-strong transition-colors",
    active
      ? "bg-primary text-[color:var(--color-on-primary)]"
      : "border border-hairline bg-canvas text-ink-muted-80 hover:text-ink",
  ].join(" ");
}

function MockWorkingDays({ reduceMotion }: { reduceMotion: boolean }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const [pulseSlot, setPulseSlot] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setPulseSlot((s) => (s + 1) % 12), 1800);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const isBlocked = (dayIdx: number, slotIdx: number) => {
    if (slotIdx === 2) return true;
    if (dayIdx === 4 && slotIdx >= 2) return true;
    if (slotIdx === 0) return true;
    return false;
  };

  const isAvailable = (dayIdx: number, slotIdx: number) =>
    !isBlocked(dayIdx, slotIdx) && (dayIdx + slotIdx) % 2 === 0;

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas">
      <div className="border-b border-hairline px-5 py-3">
        <span className="type-caption-strong text-ink-muted-48 uppercase">Your schedule</span>
      </div>
      <div className="p-5">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-[12px] border border-hairline bg-parchment p-4"
        >
          <p className="type-caption text-ink-muted-80 leading-relaxed">{mockWorkingDaysText}</p>
        </motion.div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {days.map((d, di) => (
            <div key={d}>
              <p className="type-caption-strong text-center text-ink-muted-80">{d}</p>
              <div className="mt-2 space-y-1.5">
                {[0, 1, 2, 3].map((si) => {
                  const flat = di * 4 + si;
                  const blocked = isBlocked(di, si);
                  const avail = isAvailable(di, si);
                  const pulsing = flat === pulseSlot && avail;
                  return (
                    <motion.div
                      key={si}
                      animate={
                        pulsing && !reduceMotion
                          ? { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
                          : { scale: 1, opacity: 1 }
                      }
                      transition={{ duration: 0.6 }}
                      className={`h-7 rounded ${
                        blocked
                          ? "bg-[color:var(--color-divider-soft)] opacity-50"
                          : avail
                            ? "bg-[rgba(0,102,204,0.12)] border-l-2 border-primary"
                            : "bg-[color:var(--color-divider-soft)]"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 type-caption text-ink-muted-48">
          Slots respect no-meetings-before-10, lunch blocks, and Fri half-day.
        </p>
      </div>
    </div>
  );
}

function MockRelationships({ reduceMotion }: { reduceMotion: boolean }) {
  const contacts = [
    { name: "Marcus Chen", role: "Founder, Spool", warmth: 0.9, last: "2h ago" },
    { name: "Anya Müller", role: "PM, Linear", warmth: 0.7, last: "Yesterday" },
    { name: "Tom Bradshaw", role: "Consultant", warmth: 0.25, last: "12d ago" },
    { name: "Priya Iyer", role: "Lead, Stripe", warmth: 0.55, last: "5d ago" },
  ];

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#1d1d1f]">
      <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <span className="type-caption-strong text-on-dark/72 uppercase">Going cold</span>
        <KbdBadge onDark>P</KbdBadge>
      </div>
      <ul className="divide-y divide-white/5">
        {contacts.map((c, i) => (
          <motion.li
            key={c.name}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4, ease }}
            className="px-5 py-4 flex items-center gap-4"
          >
            <Avatar name={c.name} dark />
            <div className="flex-1 min-w-0">
              <p className="type-body-strong text-on-dark truncate">{c.name}</p>
              <p className="type-caption text-on-dark-muted truncate">{c.role}</p>
            </div>
            <div className="w-[110px]">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-[color:var(--color-primary-on-dark)]"
                  initial={reduceMotion ? false : { width: 0 }}
                  whileInView={{ width: `${c.warmth * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease }}
                />
              </div>
              <p className="mt-1 type-fine text-on-dark-muted text-right">{c.last}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function MockAgent({ reduceMotion }: { reduceMotion: boolean }) {
  const [phase, setPhase] = useState(0);
  const [demoState, setDemoState] = useState<
    "intro" | "pending" | "approving" | "sent" | "editing" | "rejected"
  >("intro");
  const [draftBody, setDraftBody] = useState(
    "Tuesday 2–2:30 PM works on my end — sending an invite now with a Meet link…"
  );
  const [undoSeconds, setUndoSeconds] = useState(5);

  useEffect(() => {
    if (reduceMotion) {
      setPhase(3);
      setDemoState("pending");
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => {
        setPhase(3);
        setDemoState("pending");
      }, 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  useEffect(() => {
    if (demoState !== "sent" || reduceMotion) return;
    setUndoSeconds(5);
    const interval = setInterval(() => {
      setUndoSeconds((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [demoState, reduceMotion]);

  const showApproval = demoState === "pending" || demoState === "approving" || demoState === "editing";
  const showSent = demoState === "sent";
  const showRejected = demoState === "rejected";

  const handleApprove = () => {
    setDemoState("approving");
    if (reduceMotion) {
      setDemoState("sent");
      return;
    }
    window.setTimeout(() => setDemoState("sent"), 650);
  };

  const handleEdit = () => {
    setDemoState("editing");
  };

  const handleReject = () => {
    setDemoState("rejected");
  };

  const handleBackToPending = () => {
    setDemoState("pending");
  };

  const handleSendEdited = () => {
    setDemoState("approving");
    if (reduceMotion) {
      setDemoState("sent");
      return;
    }
    window.setTimeout(() => setDemoState("sent"), 650);
  };

  const agentMessage =
    demoState === "sent"
      ? "Done — email queued and invite on the way. You can undo for a few seconds."
      : demoState === "editing"
        ? "Make your edits below — nothing sends until you confirm."
        : demoState === "rejected"
          ? "No problem — I discarded that draft. Ask anytime if you want a new one."
          : "I've drafted the reply to Marcus and queued the calendar invite. Ready when you are.";

  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas">
      <div className="border-b border-hairline px-5 py-3 flex items-center justify-between">
        <span className="type-tagline text-ink">Agent</span>
        <span className="btn-pearl-capsule" style={{ padding: "4px 10px", fontSize: 12 }}>
          claude-sonnet-4-6
        </span>
      </div>

      <div className="p-5 space-y-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={agentMessage}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: phase >= 1 ? 1 : 0.4, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="type-body text-ink"
          >
            {agentMessage}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase >= 2 && showApproval && (
            <motion.div
              key="approval"
              layout
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[18px] border bg-parchment p-4"
              style={{ borderColor: "var(--color-primary)" }}
            >
              <p
                className="type-caption-strong text-primary uppercase"
                style={{ letterSpacing: "0.08em" }}
              >
                {demoState === "editing" ? "Editing draft" : "Pending approval"}
              </p>
              <p className="mt-2 type-body-strong text-ink">Send email to Marcus Chen</p>

              <motion.div
                layout
                className="mt-3 overflow-hidden rounded-[8px] border border-hairline bg-canvas"
              >
                <p className="border-b border-hairline px-3 py-2 type-caption text-ink">
                  <span className="type-caption-strong">Subject:</span> Re: Product review next week
                </p>
                {demoState === "editing" ? (
                  <motion.textarea
                    layout
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    value={draftBody}
                    onChange={(event) => setDraftBody(event.target.value)}
                    className="min-h-[88px] w-full resize-none bg-transparent px-3 py-3 type-caption text-ink outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary-focus)]"
                  />
                ) : (
                  <motion.p
                    layout
                    className="px-3 py-3 type-caption text-ink-muted-80"
                  >
                    {draftBody}
                  </motion.p>
                )}
              </motion.div>

              <motion.div layout className="mt-4 flex items-center gap-2">
                {demoState === "editing" ? (
                  <>
                    <Button size="sm" className="px-4" onClick={handleSendEdited}>
                      Send when ready
                    </Button>
                    <Button size="sm" variant="dark-utility" onClick={handleBackToPending}>
                      Back
                    </Button>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      animate={
                        demoState === "approving" && !reduceMotion
                          ? { scale: [1, 0.98, 1] }
                          : phase >= 3 && demoState === "pending" && !reduceMotion
                            ? { scale: [1, 1.05, 1], boxShadow: "0 0 0 4px rgba(0,102,204,0.15)" }
                            : {}
                      }
                      transition={{
                        duration: demoState === "approving" ? 0.45 : 0.5,
                        repeat: demoState === "pending" && phase >= 3 ? 2 : 0,
                      }}
                    >
                      <Button
                        size="sm"
                        className="px-4"
                        disabled={demoState === "approving"}
                        onClick={handleApprove}
                      >
                        {demoState === "approving" ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                            Sending…
                          </span>
                        ) : (
                          "Approve & send"
                        )}
                      </Button>
                    </motion.div>
                    <Button
                      size="sm"
                      variant="dark-utility"
                      disabled={demoState === "approving"}
                      onClick={handleEdit}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Pencil className="h-3 w-3" strokeWidth={1.75} />
                        Edit first
                      </span>
                    </Button>
                    <button
                      type="button"
                      disabled={demoState === "approving"}
                      onClick={handleReject}
                      className="ml-auto type-caption text-ink-muted-48 hover:text-ink transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}

          {showSent && (
            <motion.div
              key="sent"
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="space-y-3"
            >
              <div
                className="rounded-[18px] border p-4"
                style={{
                  borderColor: "var(--color-success)",
                  background: "rgba(52,199,89,0.08)",
                }}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24, delay: 0.05 }}
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 text-[color:var(--color-success)]"
                      strokeWidth={1.75}
                    />
                  </motion.div>
                  <div>
                    <p className="type-body-strong text-ink">Sent to Marcus Chen</p>
                    <p className="mt-1 type-caption text-ink-muted-48">
                      Re: Product review next week · invite queued
                    </p>
                  </div>
                </div>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 }}
                className="flex items-center justify-between rounded-[8px] border border-hairline bg-pearl px-3 py-2"
              >
                <span className="type-caption text-ink">
                  Email queued — undo available
                </span>
                <button
                  type="button"
                  className="type-caption-strong text-primary hover:underline"
                >
                  Undo{undoSeconds > 0 ? ` · ${undoSeconds}s` : ""}
                </button>
              </motion.div>
            </motion.div>
          )}

          {showRejected && (
            <motion.div
              key="rejected"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[18px] border border-hairline bg-pearl px-4 py-3 type-caption text-ink-muted-48"
            >
              Draft discarded — nothing was sent.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Avatar({ name, dark = false }: { name: string; dark?: boolean }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center type-caption-strong flex-shrink-0 ${
        dark ? "bg-white/10 text-on-dark" : "bg-[color:var(--color-canvas-parchment)] text-ink"
      }`}
    >
      {initials}
    </div>
  );
}
