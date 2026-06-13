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
    <section>
      <div className="mb-10">
        <h2 className="text-[2rem] font-semibold tracking-[-0.025em] md:text-[2.5rem]">
          Keyboard shortcuts
        </h2>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Every action on a key — no mouse required once you&apos;re in the inbox.
        </p>
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        {PUBLIC_CONTEXTS.map((context) => {
          const shortcuts = SHORTCUTS.filter((s) => s.context === context);
          if (shortcuts.length === 0) return null;

          return (
            <div key={context} className="bg-card p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">
                {contextLabels[context]}
              </h3>
              <dl className="space-y-2.5">
                {shortcuts.map((shortcut) => (
                  <div
                    key={`${context}-${shortcut.action}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{shortcut.description}</dt>
                    <dd>
                      <kbd className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
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
      <p className="mt-6 text-sm text-muted-foreground">
        Open the full cheat sheet in the inbox with{" "}
        <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-foreground">
          Shift
        </kbd>
        {" + "}
        <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-foreground">
          /
        </kbd>
      </p>
    </section>
  );
}
