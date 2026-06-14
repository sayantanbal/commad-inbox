"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Inbox,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KbdBadge, KbdSequence } from "@/components/ui/kbd-badge";
import { FeatureShowcase } from "@/components/home/feature-showcase";

interface LandingPageProps {
  isSignedIn?: boolean;
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

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
    <div className="min-h-screen bg-background text-ink">
      {/* ───────── Global nav (surface-black, 44px) ───────── */}
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

      {/* ───────── Hero (parchment, 80px vertical padding) ───────── */}
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

          {/* The single product shadow lives here */}
          <motion.div
            {...rise(0.22)}
            className="mx-auto mt-16 max-w-[1000px] overflow-hidden rounded-[18px] border border-hairline bg-canvas product-shadow"
          >
            <FeatureShowcase />
          </motion.div>
        </div>
      </section>

      {/* ───────── Feature 1: Commitments (white) ───────── */}
      <section id="features" className="bg-background">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <div>
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
          </div>
          <MockCommitments />
        </div>
      </section>

      {/* ───────── Feature 2: Availability (parchment) ───────── */}
      <section className="bg-parchment">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <MockAvailability />
          <div>
            <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
              Scheduling
            </p>
            <h2 className="mt-4 type-display-md text-ink">
              Your week,<br />one keystroke away.
            </h2>
            <p className="mt-5 type-body text-ink-muted-48 max-w-md">
              Press <KbdBadge>M</KbdBadge> on any thread. See your true availability
              from Calendar, pick a window, and the invite + reply draft are queued
              in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Feature 3: Relationships (DARK tile) ───────── */}
      <section className="bg-tile-dark text-on-dark">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <div>
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
          </div>
          <MockRelationships />
        </div>
      </section>

      {/* ───────── Feature 4: Agent (parchment) ───────── */}
      <section className="bg-parchment">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 py-20 md:grid-cols-2">
          <MockAgent />
          <div>
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
          </div>
        </div>
      </section>

      {/* ───────── Pricing (white) ───────── */}
      <section id="pricing" className="bg-background">
        <div className="mx-auto max-w-[1080px] px-6 py-20">
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
          </div>
        </div>
      </section>

      {/* ───────── Footer (parchment) ───────── */}
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
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
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

/* ───────────────────────────── Footer column ───────────────────────────── */
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

/* ───────────────────────────── Pricing card ───────────────────────────── */
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
      className={`util-card relative ${
        highlighted ? "border-primary" : ""
      }`}
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

/* ───────────────────────────── Mock visuals ───────────────────────────── */
function MockCommitments() {
  const items = [
    { who: "Marcus Chen", what: "Send proposal v2", due: "Today", status: "due" as const },
    { who: "Anya Müller", what: "Reply with Q3 numbers", due: "Tomorrow", status: "ok" as const },
    { who: "Tom Bradshaw", what: "Confirm contract terms", due: "Overdue · 2d", status: "overdue" as const },
    { who: "Priya Iyer", what: "Schedule pilot kickoff", due: "Fri", status: "ok" as const },
  ];
  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas">
      <div className="border-b border-hairline px-5 py-3 flex items-center justify-between">
        <span className="type-caption-strong text-ink-muted-48 uppercase">My commitments</span>
        <KbdBadge>W</KbdBadge>
      </div>
      <ul className="divide-y divide-[color:var(--color-divider-soft)]">
        {items.map((item) => (
          <li
            key={item.what}
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
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockAvailability() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas p-5">
      <div className="flex items-center justify-between">
        <span className="type-caption-strong text-ink-muted-48 uppercase">Pick a 30-min window</span>
        <KbdBadge>M</KbdBadge>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {days.map((d, di) => (
          <div key={d}>
            <p className="type-caption-strong text-center text-ink-muted-80">{d}</p>
            <div className="mt-2 space-y-1.5">
              {[0, 1, 2, 3].map((i) => {
                const isSelected = di === 1 && i === 2;
                const isAvail = (di + i) % 3 !== 0;
                return (
                  <div
                    key={i}
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
      <p className="mt-5 type-caption text-ink-muted-48">
        Selected:{" "}
        <span className="type-body-strong text-ink">Tue · 2:00–2:30 PM</span>
      </p>
    </div>
  );
}

function MockRelationships() {
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
        {contacts.map((c) => (
          <li key={c.name} className="px-5 py-4 flex items-center gap-4">
            <Avatar name={c.name} dark />
            <div className="flex-1 min-w-0">
              <p className="type-body-strong text-on-dark truncate">{c.name}</p>
              <p className="type-caption text-on-dark-muted truncate">{c.role}</p>
            </div>
            <div className="w-[110px]">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[color:var(--color-primary-on-dark)]"
                  style={{ width: `${c.warmth * 100}%` }}
                />
              </div>
              <p className="mt-1 type-fine text-on-dark-muted text-right">{c.last}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockAgent() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-hairline bg-canvas">
      <div className="border-b border-hairline px-5 py-3 flex items-center justify-between">
        <span className="type-tagline text-ink">Agent</span>
        <span className="btn-pearl-capsule" style={{ padding: "4px 10px", fontSize: 12 }}>
          claude-sonnet-4-6
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="type-body text-ink">
          I&rsquo;ve drafted the reply to Marcus and queued the calendar invite.
          Ready when you are.
        </p>

        <div
          className="rounded-[18px] border bg-parchment p-4"
          style={{ borderColor: "var(--color-primary)" }}
        >
          <p className="type-caption-strong text-primary uppercase" style={{ letterSpacing: "0.08em" }}>
            Pending approval
          </p>
          <p className="mt-2 type-body-strong text-ink">Send email to Marcus Chen</p>

          <div className="mt-3 rounded-[8px] border border-hairline bg-canvas p-3">
            <p className="type-caption text-ink">
              <span className="type-caption-strong">Subject:</span> Re: Product review next week
            </p>
            <p className="mt-2 type-caption text-ink-muted-80">
              Tuesday 2–2:30 PM works on my end — sending an invite now with a Meet link…
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" className="px-4">Approve &amp; send</Button>
            <Button size="sm" variant="dark-utility">Edit first</Button>
            <button className="ml-auto type-caption text-ink-muted-48 hover:text-ink transition-colors">
              Reject
            </button>
          </div>
        </div>
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

/* Make sure unused imports don't trip up lint when refactoring later. */
void Inbox;
void Sparkles;
void ShieldCheck;
void CalendarClock;
void KbdSequence;
