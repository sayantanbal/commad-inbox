"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fetchContactsApi } from "@/lib/inbox/client-api";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Contact = Awaited<ReturnType<typeof fetchContactsApi>>["contacts"][number];

type Filter = "all" | "cold" | "active" | "new";

const filterLabels: Record<Filter, string> = {
  all: "All",
  cold: "Going cold",
  active: "Active",
  new: "New",
};

export function PeoplePageClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    void fetchContactsApi()
      .then((data) => setContacts(data.contacts))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return contacts;
    return contacts.filter((c) => {
      if (filter === "cold") return c.warmth === "cold";
      if (filter === "active") return c.warmth === "active" || c.warmth === "warm";
      if (filter === "new") return c.warmth === "new";
      return true;
    });
  }, [contacts, filter]);

  return (
    <div className="min-h-screen bg-background text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-parchment/90 backdrop-blur-[20px] backdrop-saturate-[1.8]">
        <div className="mx-auto flex h-11 max-w-[1080px] items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/inbox"
              className="flex items-center gap-2 type-caption text-ink-muted-80 hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Back to inbox
            </Link>
          </div>
          <Link href="/" className="type-body-strong text-ink">
            Command Inbox
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-12">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="type-display-md text-ink">Your network</h1>
            <p className="mt-2 type-body text-ink-muted-48">
              {loading
                ? "Reading your threads…"
                : `AI-analyzed from ${contacts.length} contact${contacts.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <p className="type-caption text-ink-muted-48 inline-flex items-center gap-2">
            Press <KbdBadge>/</KbdBadge> to filter
          </p>
        </div>

        {/* Filter pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as Filter[]).map((id) => {
            const isActive = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className="chip-option"
                data-selected={isActive ? "true" : "false"}
              >
                {filterLabels[id]}
                <span
                  className={cn(
                    "type-fine",
                    isActive ? "text-primary" : "text-ink-muted-48"
                  )}
                >
                  {id === "all"
                    ? contacts.length
                    : contacts.filter((c) =>
                        id === "active"
                          ? c.warmth === "active" || c.warmth === "warm"
                          : c.warmth === id
                      ).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full rounded-[18px]" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <p className="type-body-strong text-ink">No contacts yet</p>
              <p className="type-caption text-ink-muted-48 max-w-md">
                Relationship health builds from your inbox activity. Process a few threads and
                contacts will appear here.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/inbox">Go to inbox</Link>
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <p className="type-body-strong text-ink">No one matches that filter</p>
              <p className="type-caption text-ink-muted-48">
                Try another filter or return to your full network.
              </p>
              <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                Show all contacts
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  const warmth =
    contact.warmth === "active"
      ? 0.9
      : contact.warmth === "warm"
      ? 0.65
      : contact.warmth === "new"
      ? 0.5
      : 0.2;

  const initials = contact.displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const lastContactLabel = contact.lastContactAt
    ? formatDistanceToNow(new Date(contact.lastContactAt), { addSuffix: true })
    : "Never";

  return (
    <article className="util-card flex flex-col gap-4">
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-parchment flex items-center justify-center type-caption-strong text-ink-muted-80">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body-strong text-ink truncate">
            {contact.displayName}
          </p>
          <p className="type-caption text-ink-muted-48 truncate">
            {contact.email}
          </p>
        </div>
      </header>

      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-divider-soft)]">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.max(warmth * 100, 6)}%` }}
          />
        </div>
        <p className="mt-2 type-fine text-ink-muted-48">
          Last contact: {lastContactLabel} ·{" "}
          {contact.emailCount30d} email{contact.emailCount30d === 1 ? "" : "s"} / 30d
        </p>
      </div>

      <footer className="flex items-center justify-between border-t border-divider-soft pt-3">
        <span className="type-caption text-ink-muted-80">
          {contact.openCommitmentCount > 0
            ? `${contact.openCommitmentCount} open commitment${contact.openCommitmentCount === 1 ? "" : "s"}`
            : "Nothing open"}
        </span>
        <Link
          href={`/inbox?contact=${encodeURIComponent(contact.email)}`}
          className="type-caption text-primary inline-flex items-center gap-1 hover:underline"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Link>
      </footer>
    </article>
  );
}
