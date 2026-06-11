import { SHORTCUTS, formatShortcut } from "@/lib/shortcuts";
import type { ShortcutContext } from "@/lib/types";

const contextLabels: Record<ShortcutContext, string> = {
  global: "Global",
  list: "List",
  thread: "Thread",
  composer: "Composer",
};

const PUBLIC_CONTEXTS: ShortcutContext[] = ["global", "list", "thread"];

export function ShortcutReference() {
  return (
    <section className="mt-24">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Keyboard shortcuts</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every action on a key — no mouse required once you&apos;re in the inbox.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {PUBLIC_CONTEXTS.map((context) => {
          const shortcuts = SHORTCUTS.filter((s) => s.context === context);
          if (shortcuts.length === 0) return null;

          return (
            <div
              key={context}
              className="rounded-lg border border-border bg-card/30 p-5"
            >
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">
                {contextLabels[context]}
              </h3>
              <dl className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={`${context}-${shortcut.action}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{shortcut.description}</dt>
                    <dd>
                      <kbd className="rounded border border-border bg-secondary/50 px-2 py-0.5 font-mono text-xs">
                        {formatShortcut(shortcut, true)}
                      </kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Open the full cheat sheet in the inbox with{" "}
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">Shift</kbd>
        {" + "}
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono">/</kbd>
      </p>
    </section>
  );
}
