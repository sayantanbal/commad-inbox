import Link from "next/link";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-hairline bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="type-body-strong text-ink hover:text-primary transition-colors">
            Command Inbox
          </Link>
          <nav className="flex items-center gap-4 type-caption text-ink-muted-48">
            <Link href="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="type-caption text-ink-muted-48">Last updated {lastUpdated}</p>
        <h1 className="mt-2 type-display-md text-ink">{title}</h1>
        <div className="mt-10 space-y-10 type-body text-ink-muted-80 [&_h2]:type-body-strong [&_h2]:text-ink [&_h2]:mt-0 [&_h3]:type-caption-strong [&_h3]:text-ink [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-focus">
          {children}
        </div>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-3xl px-6 py-8 type-caption text-ink-muted-48">
          © {new Date().getFullYear()} Command Inbox. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
