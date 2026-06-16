# Raw 90s demo script — single take, screen + voice only

> **Format:** One continuous screen recording. No cuts, no B-roll, no webcam.  
> **Record on:** **Production** — https://command-inbox.sayantanbal.in (deploy + smoke test before you hit Record).  
> **Rehearse on:** Local (`bun dev`) or ngrok until prod is live — same flows, different URL.  
> **Account:** Dedicated demo Gmail, **fully indexed** on **production** before Record.

Practice the full run **twice** with a timer. Target **85–90 seconds** — leave 5s buffer for fumbles.

---

## Timeline (deploy day before — recommended)

| When | What |
|------|------|
| **Day −1 (evening)** | Deploy prod → migrate → renew watches → sign in demo Gmail → connect Google → let **full INBOX index run overnight** |
| **Record day (morning)** | Confirm index banner gone → pre-send scheduling email → wait for Schedule lane → rehearse 2× on prod → **Record** → upload → social posts |

Do not connect a fresh demo account on camera — indexing must finish before Record.

---

## Features you must show (rubric alignment)

| Beat | Feature | Why judges care |
|------|---------|-----------------|
| Problem | Gmail + Calendar friction | param-4 productivity story |
| Lanes | AI triage Reply / Schedule / FYI | param-2 Gmail workflow |
| Webhook | Lane already updated from real mail | param-1 Corsair + param-2 live sync |
| **M-key** | Thread → slot → invite + draft | **Hero** — param-2, param-3, param-4 |
| Agent | NL prompt → approval cards → send | param-5 AI + MCP |
| Search | `/` semantic + `Mod+Shift+F` advanced | param-2 full index vs Gmail history |
| Stack | Corsair, webhooks, pgvector, MCP | param-1, param-5, param-7 |

**Do not tour:** People CRM, Linear, commitments, focus blocks, settings — README only.

---

## Pre-staging (do this 10 minutes before Record)

### Account & data

- [ ] Demo Gmail added as OAuth **test user** in Google Cloud Console
- [ ] Signed in on production; Google connected (Gmail + Calendar)
- [ ] Full INBOX index **complete** (no “Indexing N more threads…” banner)
- [ ] At least **one thread in Schedule lane** with scheduling intent (client / meet / call)
- [ ] **Load demo contacts** once (`friend@corsair.dev`) via onboarding if using agent example
- [ ] AI provider has quota (Gemini or OpenAI)

### Webhook proof (before camera — not during)

1. From another device, send yourself: **“Can we sync next week? I’m free Tue–Thu afternoons.”**
2. Wait until thread appears in **Schedule** lane (≤30s with Pusher; up to 60s fallback poll).
3. **Do not re-send on camera** — raw video cannot wait 30s silently.

### Browser setup

- [ ] 1920×1080 or 1440p, **dark theme**, bookmarks bar hidden
- [ ] Do Not Disturb on; close Slack/email/notifications
- [ ] Single window: Command Inbox `/inbox` loaded
- [ ] **Click the Schedule lane thread** so it’s selected before Record
- [ ] Agent prompt in clipboard (see 0:42 below)
- [ ] Optional: Calendar tab ready — you’ll switch once after M-key

### Rehearsal clipboard

```
Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it
```

---

## The script (read aloud while acting)

Speak at a calm pace (~130 words/min). **Bold** = action on screen.

---

### 0:00–0:12 — Problem + product

**Screen:** `/inbox` visible. Schedule lane selected. No mouse movement yet.

> “If your inbox is a meeting pipeline, every invite still costs ten clicks across Gmail and Calendar. **Command Inbox** merges them — AI triage, one-keystroke scheduling, and an agent on the same pipeline.”

---

### 0:12–0:22 — Lanes + webhook proof

**Action:** Click **Schedule** lane label (even if already there). Point cursor at the selected thread subject.

> “Every email lands in **Reply**, **Schedule**, or **FYI**. This thread came in live via **Gmail webhooks** through **Corsair** — no manual refresh.”

*(The thread you pre-staged is your webhook proof. Do not claim live send unless you actually sent it before recording.)*

---

### 0:22–0:42 — M-key hero (money shot)

**Action:**

1. With thread focused, press **`M`**
2. Availability picker opens — **click one free slot** (or press Enter on highlighted slot)
3. Wait for composer with **confirmation draft**
4. **Optional 3s:** `Ctrl+Tab` to **calendar.google.com** — show new event with Meet link
5. `Ctrl+Tab` back to Command Inbox

> “Press **M** — pick a slot — Google Calendar invite with Meet link, confirmation email drafted. That’s three interactions instead of a dozen in Gmail plus Calendar.”

**Do not send the draft on camera** unless you want sent mail in the demo account — draft visible is enough.

---

### 0:42–0:58 — Agent + approval

**Action:**

1. Click **Agent** sidebar (or mobile Agent tab)
2. `Ctrl+V` paste clipboard prompt → Send
3. When **Pending approval** appears for calendar → click **Approve & send invite** *(or **Schedule in inbox** only if guest is on the open thread)*
4. Approve **send_email** if separate card appears
5. Brief pause on “Calendar invite sent” / “Email sent” summary

> “Same flow in plain English. The **Corsair MCP agent** proposes calendar and email actions — nothing sends until I approve.”

---

### 0:58–1:12 — Search

**Action:**

1. Click inbox / thread list area
2. Press **`/`** → type a phrase from a real subject you have, e.g. `sync` or `meeting` → show semantic results
3. Press **`Mod+Shift+F`** → advanced search: set **sender** or **date** filter → run search

> “**Slash** searches embedded mail with **pgvector** over my indexed inbox. **Mod+Shift+F** hits full Gmail history through Corsair’s Gmail API.”

---

### 1:12–1:22 — Keyboard + stack (fast)

**Action:** Press **`?`** — cheat sheet flashes. Close it. Press **`Mod+K`** — palette opens. Escape.

> “Superhuman-style shortcuts. Built on **Next.js**, **Postgres pgvector**, **Better Auth**, **Pusher** realtime, and **Corsair** for every Gmail and Calendar call — SDK, webhooks, and MCP.”

---

### 1:22–1:30 — Close

**Screen:** Inbox hero visible or README in new tab (optional — only if you have 5s left).

> “**Command Inbox** — your inbox is your meeting pipeline. Live at **command-inbox.sayantanbal.in**. Open source on GitHub. Thanks.”

---

## If something breaks mid-take (raw recovery lines)

Keep talking; do one retry only:

| Failure | Say + do |
|---------|----------|
| M-key slow | “Corsair is fetching availability…” wait 2s |
| Agent validation error | “Let me approve the invite…” click card again |
| Search empty | Use a different query you know exists; say “indexed threads” |
| Catastrophic failure | Stop take; fix pre-staging; re-record |

---

## After recording

1. Upload to YouTube (unlisted) or Loom
2. Paste URL in [submission.md](./submission.md) and [README.md](../README.md)
3. Post [social-post.md](./social-post.md) with 30–60s clip or link
4. Confirm judges in OAuth test users ([judge-oauth.md](./judge-oauth.md))

---

## Recording checklist (day-of)

**Deploy gate — do not Record until all pass:**

- [ ] Production deploy live: `https://command-inbox.sayantanbal.in/inbox` returns 200
- [ ] `APP_URL=https://command-inbox.sayantanbal.in` on Vercel (or host)
- [ ] `bun run db:migrate` on production DB
- [ ] `bun scripts/renew-watches.ts` on production (HTTPS required for calendar watches)
- [ ] Demo Gmail added as OAuth test user in GCP
- [ ] Sign in on **production** with demo account → connect Google → full index complete
- [ ] Pre-sent webhook email sitting in Schedule lane
- [ ] Full script rehearsed 2× on prod under 90s
- [ ] Record → upload → update submission URLs

**Before prod is live:** rehearse timing on local/ngrok only — do not submit a video recorded on ngrok.
