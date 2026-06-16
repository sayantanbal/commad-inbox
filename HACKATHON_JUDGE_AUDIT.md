# Command Inbox — Strict Hackathon Judge Audit

> **Audit date:** 2026-06-14  
> **Method:** Phase 1 evidence audit per [`CORSAIR_HACKATHON_JUDGE_PROMPT.md`](./CORSAIR_HACKATHON_JUDGE_PROMPT.md)  
> **Style:** Claim-vs-code verification ([The Discerning Machine](https://devfolio.co/blog/the-discerning-machine/)) — citations are the spine; scores are deterministic sums.

---

## Submission metadata (as declared in repo)

| Field | Value | Verified |
|-------|-------|----------|
| Project | Command Inbox | ✅ |
| GitHub | https://github.com/sayantanbal/commad-inbox | ✅ public repo exists |
| Live URL | https://command-inbox.sayantanbal.in | ⚠️ not curl-verified in this audit (network unreachable from sandbox) |
| Demo video | `_add URL before submit_` | ❌ missing |
| X post | `_add URL before submit_` | ❌ missing |
| LinkedIn post | `_add URL before submit_` | ❌ draft only in `docs/social-post.md` |

**Judge-readiness verdict:** **Not judge-ready** — mandatory demo video and social posts are absent. Per rubric, **param-7 capped at 3/10**.

---

## Automatic disqualifiers & caps

| Condition | Triggered? | Action |
|-----------|------------|--------|
| Private / empty repo | No | — |
| Hardcoded Gmail/Calendar in production paths | No | Mock data isolated to landing page (`src/components/home/mock/demo-data.ts`) |
| No Corsair usage | No | Real SDK in `src/lib/corsair.ts` |
| Gmail OR Calendar missing | No | Both plugins wired |
| Basic Gmail clone, no workflow win | No | Lanes + `M` hero + agent — but lane UX still reads as inbox client |
| AI gimmick only | No | Tools execute Corsair mutations with approval |
| Live URL 404/5xx | Unverified | — |
| Secrets committed | No | Only `.env.example` in repo |
| Demo video missing | **Yes** | Cap param-7 at **3/10** |

No full **0/100** disqualifier triggered on code alone. Submission is blocked on deliverables, not implementation.

---

## Final scores (strict)

| Key | Criterion | Score | Max |
|-----|-----------|------:|----:|
| param-1 | Corsair Integration | **13** | 20 |
| param-2 | Gmail Workflow | **11** | 15 |
| param-3 | Calendar Workflow | **10** | 15 |
| param-4 | Productivity UX | **11** | 15 |
| param-5 | AI and MCP Usage | **11** | 15 |
| param-6 | Engineering Quality | **5** | 10 |
| param-7 | Demo and Documentation | **3** | 10 |
| | **TOTAL** | **64** | **100** |

Scoring bias: **strict** — PARTIAL features scored in lower third of range; thin evidence under-scored.

---

## param-1 — Corsair Integration · 13/20

### Findings (evidence)

- **SDK backbone is real:** `createCorsair` with `multiTenancy: true`, Postgres pool, KEK, Gmail + Google Calendar plugins (`src/lib/corsair.ts:9-18`).
- **Gmail mutations via Corsair:** send (`src/lib/corsair/actions.ts:43-46`), archive/restore (`:12-25`), thread list/get (`src/lib/corsair/threads.ts:26-39`).
- **Calendar mutations via Corsair:** `events.create` with Meet (`src/lib/corsair/actions.ts:83-90`), update/cancel in same module.
- **Webhooks (Gmail path):** `processWebhook(corsair, …)` on `POST /api/webhooks` (`src/app/api/webhooks/route.ts:44-49`); Gmail `messageChanged` triggers classify (`:58-61`).
- **MCP:** `buildCorsairToolDefs` + typed action tools (`src/lib/agent/mcp-tools.ts:29-47`, `src/lib/agent/action-tools.ts:35-139`).
- **OAuth connect:** `/api/connect/google`, callback `/api/auth/callback/corsair` (README + route tree).

### Claim mismatches

| Claim | Reality | Evidence |
|-------|---------|----------|
| README: “Corsair search API” | Uses `tenant.gmail.api.threads.list({ q })` — Gmail API **through** Corsair plugin, not a separate Corsair Search API surface | `src/lib/search/advanced.ts:25-28` |
| README: “Corsair caches all emails… search locally” | pgvector search only covers **classified** rows (max ~50-thread backfill window), not full mailbox | `src/lib/backfill/inbox-backfill.ts:10`, `src/lib/search/semantic.ts:34-36` |
| “Calendar webhooks” via Corsair | Calendar push hits **separate** route `/api/webhooks/calendar`, not `processWebhook` | `src/app/api/webhooks/calendar/route.ts:7-26` |

### Direct Google API bypasses (deductions)

| Path | Bypass | Evidence |
|------|--------|----------|
| Free/busy for availability | Raw `calendar/v3/freeBusy` with token from Corsair keys | `src/lib/calendar/google-free-busy.ts:16-37` |
| Watch registration | Raw Gmail + Calendar watch endpoints | `src/lib/webhooks/watch-register.ts:7-57` |
| Google Contacts import | Raw People API | `src/lib/contacts/google-contacts.ts:46` |

### Counts

- API route handlers: **42** (`src/app/api/**/route.ts`)
- Corsair grep hits in `src/`: **~50 files**
- Webhook handlers: **2** (`/api/webhooks`, `/api/webhooks/calendar`)

### Suggested range applied: 12–17 → **13** (partial bypasses + calendar webhook split + search API naming inflation)

---

## param-2 — Gmail Workflow · 11/15

### Specific workflow improvements (verified)

1. **AI triage lanes** — Reply / Schedule / FYI / Done reorder inbox vs flat Gmail (`src/lib/classifier/classify-thread.ts:19-26`, `src/lib/classifier/persist.ts:40-67`).
2. **Hero `M` workflow** — thread → availability slot → Calendar invite + AI confirmation draft (`src/app/api/inbox/meeting/route.ts:43-97`, `src/lib/shortcuts.ts:8`).
3. **Advanced mailbox search** — sender, dates, attachments, lane filter over Gmail `q` (`src/lib/search/advanced.ts:17-70`, `Mod+Shift+F` in `src/lib/shortcuts.ts:18`).
4. **Send-later + snooze** — cron-dispatched (`src/app/api/cron/process-due/route.ts:20-22`).

### Deductions

- **Inbox list capped at 50 threads** — same limit as backfill (`src/lib/corsair/threads.ts:7-8`, `BACKFILL_THREAD_LIMIT = 50`). Not a full-mailbox command center for heavy users.
- **Semantic search (`/`) empty until backfill completes** and only indexes classified subset (`src/lib/search/semantic.ts:34-36`). Bonus “sub-second search across entire email” is **overstated**.
- **Polling fallback** every 15s (no Pusher) or 60s (with Pusher) — realtime is not webhook-only (`src/hooks/use-inbox-realtime.ts:42-46`).
- Lane UI still presents as **three-column email client** — differentiated, not revolutionary.

### Suggested range applied: 8–12 → **11**

---

## param-3 — Calendar Workflow · 10/15

### Findings

- **Create invite with Meet + attendees** via Corsair (`src/lib/corsair/actions.ts:55-100`).
- **Thread-linked meetings** persisted (`thread_meetings` in `src/lib/db/schema.ts:132-146`).
- **Reschedule / cancel** routes and agent tools (`src/app/api/inbox/meeting/route.ts`, `src/lib/agent/action-tools.ts:117-137`).
- **Week-strip calendar** loaded via Corsair events (`src/lib/inbox/load-inbox-data.ts:18-21`).
- **Focus blocks** (`src/app/api/inbox/focus-block/route.ts`).

### Deductions

- **Calendar webhook handler is a stub** — only cache invalidation + Pusher; no event fetch/sync (`src/lib/webhooks/calendar-event.ts:4-7`).
- **`/api/webhooks/calendar` lacks channel-token verification** — accepts POST with `tenantId` query param only (`src/app/api/webhooks/calendar/route.ts:7-26`). Spoofable if URL is known.
- **Availability free/busy bypasses Corsair SDK** (`src/lib/calendar/google-free-busy.ts`).
- Calendar is **secondary** to email; fewer step-reduction proofs than Gmail hero path.

### Suggested range applied: 8–12 → **10** (working CRUD + clear `M` win, but thin realtime calendar sync)

---

## param-4 — Productivity UX · 11/15

### Findings

- **Shortcut registry** — 17 bindings including `j/k/e/r/m`, `/`, `Mod+K`, `Mod+Shift+F` (`src/lib/shortcuts.ts:3-30`).
- **Command palette** — `src/components/inbox/command-palette.tsx` (cmdk).
- **Approval-gated agent UI** — `AgentToolApproval` + `needsApproval: true` on write tools (`src/components/inbox/agent-chat-panel.tsx:74-80`, `src/lib/agent/action-tools.ts:45`).
- **Loading states** — skeletons, activity bar for backfill (`src/app/inbox/inbox-client.tsx:11-13`).
- **PWA / mobile** — manifest route, mobile tab bar, swipe gestures (per README + component tree).

### Deductions

- **`inbox-shell.tsx` is 2,227 lines** — monolithic, hard to maintain (`wc -l` audit).
- **Multi-step onboarding** before `/inbox` adds friction (`src/app/inbox/page.tsx:34-37`).
- **Landing page** uses explicit mock components (`src/components/home/landing-page.tsx:18-22`, `484+`) — fine for marketing, but product still “inbox-shaped.”
- Core send/schedule path is keyboard-friendly; many power features (commitments, people CRM, Linear export) add **scope noise** vs hackathon focus.

### Suggested range applied: 8–12 → **11**

---

## param-5 — AI and MCP Usage · 11/15

### Findings

- **MCP discovery + execution:** `buildCorsairToolDefs` merged with custom tools (`src/lib/agent/mcp-tools.ts:24-50`).
- **Write tools require approval:** `send_email`, `create_calendar_invite`, `schedule_send`, reschedule, cancel (`src/lib/agent/action-tools.ts:45,64,82,120,133`).
- **Agent route wires tools into `streamText`** with `stepCountIs(8)` (`src/app/api/agent/chat/route.ts:44-62`).
- **Classifier changes inbox ordering** — lane + priority from LLM (`src/lib/classifier/classify-thread.ts:57-66`).
- **Example prompt matches hackathon spec** (`src/components/inbox/agent-chat-panel.tsx:34-35`).

### Deductions

- **No server-side rate limiting on `/api/agent/chat`** — only provider quota detection/fallback (`src/lib/ai/rate-limit.ts` detects 429 from OpenAI/Gemini; does **not** throttle user requests). See Rate limiting section.
- **Silent degradation:** classifier falls back to heuristics on AI failure (`src/lib/classifier/classify-thread.ts:67-69`) — lanes may look “AI-powered” while running rules.
- **Embeddings/search depend on backfill** — agent chat works, but semantic lane context is incomplete for older mail.

### Suggested range applied: 8–12 → **11**

---

## param-6 — Engineering Quality · 5/10

> Rubric: **two or more critical security misses → cap at 5/10**.

### Strengths

- Next.js 15 App Router, **42** API routes, Drizzle schema + **11** SQL migrations (`drizzle/`, `src/lib/db/schema.ts`).
- Zod validation on API bodies (`src/lib/schemas/api.ts`, agent tools, webhooks).
- Session auth on mutations via `requireSessionApi` (`src/lib/api/require-session.ts:7-23`).
- Gmail webhook signature handling delegated to Corsair `processWebhook` (`src/app/api/webhooks/route.ts:44-49`).
- Cron routes protected with `CRON_SECRET` (`src/app/api/cron/process-due/route.ts:13-15`).
- Env validation with Zod (`src/lib/env.ts:18+`), `.env.example` documented.
- **Production build passes** (`bun run build`).
- No `: any` in `src/` (grep clean).

### Critical gaps (security & reliability)

| Issue | Severity | Evidence |
|-------|----------|----------|
| **No API rate limiting** on `/api/agent/chat`, `/api/inbox/send`, `/api/inbox/draft`, AI classify paths | Critical | `src/lib/ai/rate-limit.ts` only classifies **provider** 429 errors; no middleware/window limiter on routes |
| **Calendar webhook unauthenticated** | Critical | `src/app/api/webhooks/calendar/route.ts` — no `X-Goog-Channel-Token` check |
| **CI unit tests failing** | High | `bun test`: **11 pass, 2 fail** — webhook tests import server-only module (`src/lib/__tests__/submission-smoke.test.ts:82-92`); `.github/workflows/ci.yml:22` runs same suite → **CI should fail** |
| **Docs drift** | Medium | `docs/whats-done.md:13` claims “9 unit/smoke tests passing”; actual run shows 2 failures |
| **Monolithic UI** | Medium | `inbox-shell.tsx` — **2,227** lines |
| **Middleware is cookie-presence only** | Medium | `src/middleware.ts:15-16` — no server session validation on page routes |
| **No integration/E2E tests** for Corsair send/schedule/webhook paths | Medium | Only schema/query unit tests in `src/lib/__tests__/` |

### Suggested range applied: cap at **5/10** (rate limit + calendar webhook auth misses)

---

## param-7 — Demo and Documentation · 3/10

### Findings

- **README is strong:** architecture mermaid, Corsair feature list, bonus table, setup steps (`README.md`).
- **Docs site** referenced: docs.command-inbox.sayantanbal.in (`README.md:118`).
- **Submission checklist exists** (`docs/submission.md`, `docs/demo-script.md`, `docs/judge-oauth.md`).
- **GitHub repo** public and matches README URL.

### Missing mandatory deliverables

| Deliverable | Status | Evidence |
|-------------|--------|----------|
| Demo video (YC-style) | ❌ | `README.md:195`, `docs/submission.md:11` |
| X/Twitter post URL | ❌ | `README.md:196` |
| LinkedIn post URL | ❌ | `README.md:197`; draft in `docs/social-post.md` only |
| Live deploy smoke sign-off | ☐ | `docs/submission.md:10` unchecked |

Per rubric: demo video missing → **cap at 3/10**. Cannot award 9–10 without video + verified live walkthrough.

---

## Rate limiting — dedicated audit

The hackathon judge prompt explicitly requires rate limiting on **`/api/chat`**, **`/api/send`**, and AI endpoints (`CORSAIR_HACKATHON_JUDGE_PROMPT.md:115,326`).

### What exists

| Mechanism | Purpose | Location |
|-----------|---------|----------|
| `isRateLimitError()` | Detect **upstream** OpenAI/Gemini 429/quota errors | `src/lib/ai/rate-limit.ts` |
| `with-fallback` provider chain | Switch OpenAI ↔ Gemini on provider rate limit | `src/lib/ai/with-fallback.ts:72` |
| Backfill batch pause | Stop backfill on quota exhaustion | `src/lib/backfill/inbox-backfill.ts:48-51` |
| Agent UI message | User-facing hint on rate limit errors | `src/components/inbox/agent-chat-panel.tsx:374` |

### What is missing

| Expected control | Status |
|------------------|--------|
| Per-user/IP sliding window on `POST /api/agent/chat` | ❌ |
| Per-user limit on `POST /api/inbox/send` | ❌ |
| Per-user limit on `POST /api/inbox/draft` | ❌ |
| Webhook replay / flood protection | ❌ |
| `express-rate-limit` or equivalent | ❌ (only appears in transitive MCP SDK lockfile) |

**Verdict:** Rate limiting is **provider-side error handling only**, not **application-side abuse protection**. Strict judge would dock param-6 heavily (applied above).

---

## Bonus tasks verified

| Bonus | Status | Evidence | Notes |
|-------|--------|----------|-------|
| MCP agent chat | **implemented** | `src/app/api/agent/chat/route.ts`, `agent-chat-panel.tsx` | Approval UI present |
| Realtime webhooks | **partial** | Gmail via Corsair `processWebhook`; calendar stub; 15–60s poll fallback | Not polling-only, but not fully push-driven |
| LLM priority filtering | **implemented** | `src/lib/classifier/classify-thread.ts` | Heuristic fallback weakens guarantee |
| Keyboard shortcuts / palette | **implemented** | `src/lib/shortcuts.ts`, `command-palette.tsx` | |
| Corsair search API UI | **partial** | `src/lib/search/advanced.ts` | Gmail `threads.list({q})` via Corsair; not dedicated Search API |
| Vector local search | **partial** | `src/lib/search/semantic.ts`, pgvector column | ~50 classified threads; empty pre-backfill; not full mailbox |

---

## Stack confirmation

| Layer | Detected |
|-------|----------|
| Next.js | 15.3.4 (`package.json:56`) |
| React | 19.1.0 |
| ORM | Drizzle 0.45.2 |
| Postgres | Neon pattern in README; pgvector on `classifications.embedding` |
| Corsair | `corsair@0.1.76`, `@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, `@corsair-dev/mcp` |
| Auth | Better Auth |
| Realtime | Pusher (optional) |

---

## Architecture (text)

```
[Google Gmail/Calendar]
        ↕ (plugins)
[Corsair SDK — multi-tenant, Postgres cache, OAuth]
        ↕
[Next.js API routes] ←→ [App tables: classifications, embeddings, meetings, snoozes]
        ↕
[Inbox UI] ←Pusher/poll→ [Realtime events]

Gmail push: Pub/Sub → POST /api/webhooks?tenantId=… → processWebhook → classify + embed
Calendar push: Google → POST /api/webhooks/calendar?tenantId=… → Pusher only (thin)
Agent: UI → POST /api/agent/chat → streamText + MCP tools → Corsair send/create (after approval)
```

---

## Top 3 strengths (evidence-backed)

1. **Corsair is the real integration layer** for Gmail/Calendar read/write, not a README fiction (`src/lib/corsair.ts`, `src/lib/corsair/actions.ts`).
2. **Hero `M` workflow** materially reduces scheduling steps vs Gmail+Calendar tab switching (`src/app/api/inbox/meeting/route.ts:84-97`).
3. **MCP agent with `needsApproval: true`** on send/invite — matches hackathon example and avoids blind auto-send (`src/lib/agent/action-tools.ts:45-93`).

---

## Top 5 blockers (priority order)

1. **No demo video URL** — mandatory; caps documentation score and disqualifies from prize consideration until fixed.
2. **No published X/LinkedIn posts** — mandatory tags/hashtags not verifiable.
3. **Application rate limiting absent** on chat/send/AI routes — security rubric miss.
4. **CI tests failing** (2/13) — submission smoke tests broken; undermines “engineering quality” narrative.
5. **Semantic/local search scope overstated** — 50-thread classified subset, not full mailbox; judges will notice vs README claim.

---

## Gap remediation checklist

Use this as a pre-submit punch list.

### P0 — Submission (blocks judging)

- [ ] Record and publish **YC-style demo video** (~90s): problem → lanes → `M` hero → agent approve send+invite → search → stack/Corsair
- [ ] Publish **LinkedIn + X posts** with required tags (`docs/social-post.md`); paste URLs into `README.md` and `docs/submission.md`
- [ ] **Live smoke test** on production URL (sign-in, connect, send, schedule, webhook latency)
- [ ] Add judge emails to Google OAuth test users (`docs/judge-oauth.md`)

### P1 — Security (param-6 recovery: +2–3 points)

- [ ] Add per-user rate limiting on `POST /api/agent/chat`, `POST /api/inbox/send`, `POST /api/inbox/draft` (e.g. sliding window middleware)
- [ ] Verify `X-Goog-Channel-Token` on `/api/webhooks/calendar` (store token at watch registration)
- [ ] Fix failing tests: extract `shouldClassifyGmailEvent` to a non-`server-only` module or mock import in tests

### P2 — Claim accuracy (param-1/2/5: +2–4 points)

- [ ] README: clarify semantic search covers **classified/backfilled** threads, not entire mailbox; advanced search covers history
- [ ] Either expand backfill beyond 50 threads or document intentional cap
- [ ] Optionally route free/busy through Corsair if/when plugin supports it (remove bypass)

### P3 — Polish (param-3/4: +1–2 points)

- [ ] Calendar webhook: fetch updated events via Corsair and merge into UI state (not Pusher-only)
- [ ] Split `inbox-shell.tsx` or document why monolith is acceptable
- [ ] Reduce onboarding steps for returning hackathon judges (optional “skip to inbox”)

---

## JSON extraction (Phase 2 shape)

```json
{
  "scores": {
    "param-1": 13,
    "param-2": 11,
    "param-3": 10,
    "param-4": 11,
    "param-5": 11,
    "param-6": 5,
    "param-7": 3
  },
  "paramReasoning": {
    "param-1": "Corsair SDK, Gmail/Calendar plugins, processWebhook, and MCP tool defs are wired in production paths (src/lib/corsair.ts:9-18, src/app/api/webhooks/route.ts:44-49, src/lib/agent/mcp-tools.ts:29-47). Deducted for direct Google API bypasses in free/busy and watch registration (src/lib/calendar/google-free-busy.ts:26, src/lib/webhooks/watch-register.ts:7) and a thin non-Corsair calendar webhook route (src/app/api/webhooks/calendar/route.ts:7-26).",
    "param-2": "Meaningful wins: AI triage lanes (src/lib/classifier/persist.ts:40-67), M-key invite+draft hero (src/app/api/inbox/meeting/route.ts:84-97), and advanced Gmail q search (src/lib/search/advanced.ts:25-28). Deducted for 50-thread inbox cap (src/lib/corsair/threads.ts:7-8) and semantic search limited to backfilled classifications (src/lib/search/semantic.ts:34-36).",
    "param-3": "Calendar create/update/cancel via Corsair (src/lib/corsair/actions.ts:83-100) and thread-linked meetings (src/lib/db/schema.ts:132-146) with a clear M-driven UX. Deducted because calendar webhooks only broadcast (src/lib/webhooks/calendar-event.ts:4-7), free/busy bypasses Corsair (src/lib/calendar/google-free-busy.ts:26), and calendar push auth is weak (src/app/api/webhooks/calendar/route.ts:7-26).",
    "param-4": "Strong shortcut registry and command palette (src/lib/shortcuts.ts:3-30, src/components/inbox/command-palette.tsx) plus approval-gated agent UI. Deducted for 2227-line inbox-shell.tsx monolith and multi-step onboarding friction (src/app/inbox/page.tsx:34-37).",
    "param-5": "MCP tools execute real Corsair send/invite with needsApproval (src/lib/agent/action-tools.ts:45-93) and classifier changes lane ordering (src/lib/classifier/classify-thread.ts:57-66). Deducted for no app-level rate limits on /api/agent/chat (src/app/api/agent/chat/route.ts:23-72) and heuristic classifier fallback (src/lib/classifier/classify-thread.ts:67-69).",
    "param-6": "Solid structure: Zod env, Drizzle migrations, session-gated APIs, Corsair webhook verification on Gmail path. Capped at 5/10 for missing endpoint rate limiting (src/lib/ai/rate-limit.ts is provider-only), unauthenticated calendar webhook (src/app/api/webhooks/calendar/route.ts), and 2 failing CI tests (src/lib/__tests__/submission-smoke.test.ts:82-92).",
    "param-7": "README, docs site, and Corsair feature lists are excellent (README.md). Capped at 3/10 because demo video and social post URLs are explicitly missing (README.md:195-197, docs/submission.md:11-14)."
  },
  "summary": "Command Inbox is a credible scheduling-centric Gmail+Calendar command center with real Corsair wiring and a defensible hero workflow. Corsair integration is strong but not pristine: several Google calls bypass the SDK and calendar webhooks are thin. Gmail workflow delivers lane triage and M-key invite+draft, though inbox and semantic search are capped at ~50 threads. AI/MCP executes approved send and invite actions, but application rate limiting is absent. Engineering is prototype-to-production quality with security gaps and failing smoke tests. Not judge-ready because demo video and social posts are missing.",
  "disqualifier_flags": ["demo_video_missing", "social_posts_missing"],
  "bonus_tasks_verified": {
    "mcp_agent_chat": "implemented",
    "realtime_webhooks": "partial",
    "llm_priority_filter": "implemented",
    "keyboard_shortcuts": "implemented",
    "corsair_search_api": "partial",
    "vector_local_search": "partial"
  },
  "claim_mismatches": [
    {
      "claim": "Sub-second local search across entire email",
      "reality": "pgvector search only on classified rows after 50-thread backfill",
      "evidence": "src/lib/search/semantic.ts:34-36, src/lib/backfill/inbox-backfill.ts:10"
    },
    {
      "claim": "Rate limiting for AI calls",
      "reality": "Provider 429 detection only; no per-user API throttling",
      "evidence": "src/lib/ai/rate-limit.ts:1-66, src/app/api/agent/chat/route.ts:23-72"
    },
    {
      "claim": "9 unit/smoke tests passing",
      "reality": "11 pass, 2 fail on webhook test imports",
      "evidence": "docs/whats-done.md:13, src/lib/__tests__/submission-smoke.test.ts:82-92"
    },
    {
      "claim": "Corsair search API",
      "reality": "Gmail threads.list with q via Corsair plugin",
      "evidence": "src/lib/search/advanced.ts:25-28"
    }
  ]
}
```

---

## Human panel note

A strict automated audit scores **64/100** today. A human judge with taste for workflow innovation might add **+3–5** for depth (commitments, people CRM, send-later, focus mode) or deduct **−3–5** for scope creep away from the hackathon brief. The evidence layer should not conflate those judgments — it should surface that **implementation ≈ Phase 6 complete**, **submission ≈ Phase 0 incomplete**.

**If only submission gaps are fixed (video + posts + live verify):** param-7 rises to ~7–8 → **total ~68–72/100**.

**If P0 + P1 gaps are fixed:** param-6 → ~7–8, param-7 → ~8 → **total ~74–78/100**.

**If all gaps through P2 are fixed:** param-1/2/5 each +1–2 → **total ~80–85/100** — competitive tier assuming live demo proves real send/schedule.
