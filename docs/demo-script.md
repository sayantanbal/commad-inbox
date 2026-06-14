# YC-style demo script (~90 seconds)

Record screen + voiceover. Dark theme, `/inbox` loaded, real Gmail connected. Practice hero + agent flows once before recording.

## 0:00–0:12 — Problem

> "If your inbox is a meeting pipeline — client calls, intros, reschedules — you're living in two apps. Gmail for the thread, Calendar for the slot. Every meeting costs a dozen clicks."

Show Gmail + Calendar tabs briefly, then cut to Command Inbox.

## 0:12–0:22 — Solution + lanes

> "Command Inbox merges them. AI triages every email into Reply, Schedule, or FYI — so you always know what kind of work you're doing."

Click through lanes. Point out priority badges on a high-priority thread.

## 0:22–0:40 — Hero workflow (the money shot)

> "Here's the demo moment. Client asks to meet next week."

1. Select a scheduling thread (Schedule lane)
2. Press **`M`**
3. Inline availability appears beside the email
4. Click a free slot → Enter
5. Show meeting banner + confirmation draft in composer

> "One keystroke. Invite sent, reply drafted. That was ten clicks in Gmail."

## 0:40–0:55 — Agent chat

Open Agent panel (desktop sidebar or mobile tab).

> "Or just ask in plain English."

Paste or type:

```
Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it
```

Approve each **calendar invite** and **email** preview card (`create_calendar_invite`, then `send_email`). Show completion summary.

> "Corsair MCP discovers Gmail and Calendar operations, but nothing sends without your approval."

## 0:55–1:05 — Search

1. Press **`/`** → semantic search over classified threads
2. Press **`Mod+Shift+F`** → filter by sender or date across full Gmail history

> "Sub-second local search on classified mail, plus Corsair Gmail search for everything else."

## 1:05–1:15 — Keyboard UX flash

Quick cuts: **`E`** archive with undo toast, **`Mod+K`** palette, **`?`** cheat sheet.

> "Superhuman-style shortcuts on desktop, swipe gestures and PWA on mobile."

## 1:15–1:25 — Stack + why Corsair

> "Next.js, Neon pgvector, Vercel AI SDK, Better Auth. All Gmail and Calendar traffic goes through Corsair — webhooks, SDK plugins, MCP — no raw Google client code in our app."

Show architecture diagram from README if recording slides.

## 1:25–1:30 — Close

> "Command Inbox — your inbox is your meeting pipeline. One keystroke per invite."

---

## Recording checklist

- [ ] Real account connected (not mock data)
- [ ] At least one thread in Schedule lane
- [ ] AI provider has quota (OpenAI or Gemini)
- [ ] Hide browser bookmarks bar; 1440p or 1080p, dark mode
- [ ] Disable notifications / Do Not Disturb
- [ ] Test agent prompt end-to-end before rolling camera (approve both invite + email previews)

## B-roll ideas (optional)

- Mobile: swipe archive, bottom tabs, FAB → palette
- Webhook: send yourself email → lane updates live
- Re-embed banner when switching AI provider
