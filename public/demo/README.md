# Demo visual assets

Record and drop files here before hackathon submission. Paths referenced by the docs site and README.

## Required files

| File | Size | Purpose |
|------|------|---------|
| `hero.gif` | ≤ 90s loop | Docs homepage + README hero — show `M` meeting flow end-to-end |
| `inbox-triage.png` | 1440×900 | Lane tabs + thread list screenshot |
| `agent-approval.png` | 1440×900 | Agent chat with approval gate for `send_email` |
| `mobile-drawer.png` | 390×844 | Mobile navigation drawer (Sent / Snoozed / Archive) |

## Recording checklist (hero GIF)

1. Use the **pre-indexed demo Gmail** (see [evaluator guide](/docs/overview/evaluator-guide)).
2. Open **Schedule** lane → select a thread → press **`M`** → pick a slot → send confirmation draft.
3. Show **undo toast** after archive (`E`) once.
4. Open **⌘K** palette → jump to Sent or search a thread by sender.
5. Keep cursor movement minimal; 1080p capture; trim to ≤ 90 seconds.

## After export

```bash
# From repo root — copy captures into public/demo/
cp ~/Downloads/hero.gif public/demo/hero.gif
cp ~/Downloads/inbox-triage.png public/demo/inbox-triage.png
```

Docs reference these with `/demo/hero.gif` etc. Rebuild docs if paths change.
