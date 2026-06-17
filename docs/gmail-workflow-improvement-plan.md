# Gmail Workflow Assessment & Max-Potential Plan

**Project:** Command Inbox  
**Assessed:** 2026-06-17  
**Scope:** Gmail-side workflows (ingest, triage, send, attachments, automation) — not Corsair plumbing (see [corsair-integration-plan.md](./corsair-integration-plan.md))  
**Overall Gmail workflow score:** **73 / 100**  
**Realistic max after this plan:** **92–94 / 100** (100 requires a full user-defined rules engine, Drive vault, and analytics product — outside scheduling-centric positioning)

---

## Executive summary

Command Inbox is **not** a generic Gmail automation platform (n8n / Apps Script style). It is a **scheduling-centric triage inbox** where Gmail workflows serve reply, schedule, and noise-reduction goals. On that axis the implementation is **strong and production-shaped**: Corsair webhooks drive realtime classification, embeddings, commitments extraction, and UI push; the hero-adjacent lane model and `M` meeting flow are wired end-to-end; send-later, snooze, and outbound attachments are real—not stubs.

What holds the score back is **incomplete automation loops** (commitment follow-ups generate text but never surface as drafts), **no user-configurable rules** (the gmail-workflows skill patterns—Drive save, label rules, invoice routing—are absent by design but cap “workflow completeness”), **attachment handling limited to outbound staging**, and **thin test coverage** on webhook-driven paths.

**Combined Gmail + Calendar workflow score (for cross-reference):** **70 / 100** — see [calendar-workflow-improvement-plan.md](./calendar-workflow-improvement-plan.md).

---

## Per-workflow scores

| # | Workflow | Score | Primary code |
|---|----------|------:|--------------|
| 1 | Realtime ingest & AI triage | **82** | `gmail-event.ts`, `classifier/persist.ts`, `webhooks/route.ts` |
| 2 | Inbox indexer / backfill | **78** | `backfill/inbox-backfill.ts`, `backfill/list-inbox-thread-ids.ts` |
| 3 | Lane classification & scheduling intent | **85** | `classifier/classify-thread.ts`, `inbox/classification-lane.ts` |
| 4 | Archive / restore | **88** | `corsair/actions.ts` → `threads.modify` |
| 5 | Reply, compose & send | **80** | `actions.ts`, `gmail/raw-message.ts`, `api/inbox/send` |
| 6 | Send-later & scheduled dispatch | **76** | `inbox/scheduled-sends.ts`, `cron/process-due` |
| 7 | Snooze (filter-based) | **74** | `api/inbox/snooze`, `inbox/snoozes.ts`, `snooze-picker.tsx` |
| 8 | Outbound attachments | **68** | `gmail/outbound-attachment.ts`, `outbound-attachments/*` |
| 9 | Focus-mode auto-reply | **65** | `focus/auto-reply.ts`, `focus/window.ts` |
| 10 | Commitments extract & follow-up | **58** | `commitments/persist.ts`, `commitments/follow-up.ts` |
| 11 | Daily brief (inbox slice) | **77** | `ai/daily-brief.ts`, `api/inbox/daily-brief` |
| 12 | Search (semantic + advanced Gmail query) | **75** | `search/gmail-query.ts`, `api/search/advanced` |
| 13 | Agent email tools | **79** | `agent/action-tools.ts` (`send_email`, `schedule_send`, `stage_thread_attachment`) |
| 14 | Send-time suggestion | **66** | `send-time/suggest.ts`, `api/inbox/send-time` |
| **Weighted overall** | | **73** | Core triage + hero path weighted highest |

### Score rubric (per workflow)

| Band | Meaning |
|------|---------|
| 90–100 | Best-in-class for scheduling inbox; tested; configurable; closed loop |
| 75–89 | Shipped, reliable, good UX; minor gaps |
| 60–74 | Works but incomplete loop, weak edge cases, or no tests |
| &lt;60 | Stub, logs-only, or missing user-visible outcome |

---

## What is already strong

### 1. Realtime pipeline is end-to-end

```
Gmail push → Corsair processWebhook → shouldClassifyGmailEvent
  → classifyThreadForUser (lane + intent + embed)
  → extractCommitmentsForUser (async)
  → maybeSendFocusAutoReply (async)
  → invalidateDailyBriefCache
  → Pusher inbox-changed
```

`shouldClassifyGmailEvent` correctly scopes to `messageReceived` with a `threadId` — avoids wasted AI on label-only changes.

### 2. Two-phase inbox indexing

- **Quick backfill** (~50 threads) for immediate lanes  
- **Full INBOX index** (paginated `threads.list`, capped) with progress events  
- Rate-limit aware (`isRateLimitError` pauses batch)

### 3. Send path is production-grade

- RFC822 raw MIME via `buildRawEmail`  
- Threading headers (`InReplyTo`, `References`)  
- CC/BCC, HTML body, attachment staging from upload or thread forward  
- Cron `process-due` dispatches scheduled sends with claim semantics

### 4. Agent parity with UI

`send_email`, `schedule_send`, and `stage_thread_attachment` mirror composer capabilities — important for the agent-first shell.

---

## Critical gaps (why not higher)

### 1. Commitment follow-up is a dead end

`processCommitmentFollowUps` (nightly cron) calls Gemini, then **only** `markFollowUpDraftQueuedAt` and `console.info` — the generated HTML is **never stored or shown**.

```38:44:src/lib/commitments/follow-up.ts
      const { text } = await generateTextWithProvider(userId, preferred, prompt, FOLLOW_UP_SYSTEM);
      await markFollowUpQueued(userId, row.id);
      queued++;
      console.info(`[follow-up] queued draft for ${row.id}`, text.slice(0, 80));
```

Users see commitments in the UI but cannot act on automated follow-ups.

### 2. No inbound attachment workflows

Compared to [gmail-workflows skill](../.agents/skills/gmail-workflows/SKILL.md) templates:

| Template pattern | Status |
|------------------|--------|
| Auto-save attachments to Drive | **Not implemented** |
| Invoice / sender-based routing | **Not implemented** |
| Label rules & archive-after-process | **Not implemented** (lanes are app-side, not Gmail labels) |
| Duplicate detection | **Not implemented** |
| Batch nightly attachment digest | **Not implemented** |

Outbound staging is solid; **inbound attachment intelligence is zero**.

### 3. Focus auto-reply is minimal

- One template, one reply per sender per day  
- No VIP allowlist, no schedule-lane exception, no “only external domains”  
- Sends immediately on webhook (no debounce if thread gets multiple messages)

### 4. Webhook handler fires side effects without idempotency keys

Duplicate `messageReceived` events could double-classify (likely idempotent DB upsert) but could **double auto-reply** before `hasAutoRepliedToday` races.

### 5. Test floor is thin for workflows

Existing tests: `inbox-index.test.ts`, `agent-scheduling-intent.test.ts`, `attachment-limits.test.ts`, `raw-message.test.ts`, `gmail-event-filter` (via filter module).  
**Missing:** webhook handler integration, scheduled send dispatch, focus auto-reply guards, commitment extract → UI flow.

### 6. Send-time suggestion ignores calendar

`suggestSendTime` uses reply-hour histogram only — does not avoid user focus blocks or meeting density.

---

## Max-potential plan

Phases ordered by **user-visible workflow lift per effort**. Estimate: **~8–12 days** focused work.

### Phase 0 — Workflow observability (0.5 day) → +0 (enables tuning)

- [ ] Structured logs on every workflow step: `classify`, `embed`, `commitment_extract`, `focus_autoreply`, `scheduled_send_dispatch` with `tenantId`, `threadId`, `durationMs`, `outcome`
- [ ] `webhook_attempts` table already exists — add dashboard or script for failure rate
- [ ] Metric: time from webhook to Pusher `inbox-changed` (p50/p95)

**Done when:** You can answer “why didn’t this thread classify?” from logs alone.

---

### Phase 1 — Close the commitment loop (1.5 days) → **+8 points** (workflow #10 → ~78)

- [ ] Add `follow_up_draft_html` column (or `drafts` table row keyed by `commitmentId`)
- [ ] Persist Gemini output in `processCommitmentFollowUps`
- [ ] Commitments UI: “Review follow-up” opens composer pre-filled; one-click send
- [ ] Agent tool: `draft_commitment_follow_up` with approval card
- [ ] Unit test: follow-up only queues once; draft survives page reload

**Done when:** Nightly cron produces reviewable drafts, not log lines.

---

### Phase 2 — Webhook hardening & idempotency (1 day) → **+4 points** (workflows #1, #9)

- [ ] Dedupe key: `(tenantId, messageId)` or `(tenantId, threadId, historyId)` in short-TTL store (Redis/Postgres)
- [ ] Skip classify if classification `updatedAt` &gt; message internal date (optional optimization)
- [ ] Focus auto-reply: debounce 2–5 min per thread; skip if lane is `schedule` or thread has open scheduling intent
- [ ] Integration test: duplicate webhook does not double auto-reply

---

### Phase 3 — Inbound attachment intelligence (2–3 days) → **+6 points** (workflow #8 → ~82)

Scope for **scheduling inbox**, not full finance automation:

- [ ] On classify: detect `has:attachment` + lane `fyi`/`reply`; surface attachment chips in thread view (filename, size, mime) — fetch via existing `google-proxy` attachment path
- [ ] Optional user pref: “Save scheduling attachments” → copy PDF/ics to app storage or Drive folder (single folder, date-based naming per gmail-workflows skill)
- [ ] Agent: `list_thread_attachments`, `stage_thread_attachment` (already exists) — add `summarize_attachment` for PDF/agenda before meetings
- [ ] Rate limits + size caps aligned with `attachment-limits.ts`

**Done when:** User can see and forward inbound attachments without leaving thread; optional Drive save for power users.

---

### Phase 4 — User rules lite (2 days) → **+7 points** (new workflow → ~80)

Avoid building n8n; ship **5 built-in rules** with toggles in preferences:

| Rule | Trigger | Action |
|------|---------|--------|
| VIP never auto-reply | `from` in VIP list | Skip focus auto-reply |
| Auto-archive newsletters | classifier lane `fyi` + List-Unsubscribe header | Archive after 24h (cron) |
| Schedule lane pin | lane `schedule` | Never snooze-to-done without confirm |
| Attachment FYI | `has:attachment` + from domain allowlist | Lane boost to `reply` |
| Commitment boost | phrases in body | Force commitment extract |

- [ ] Store rules in `user_preferences.rules_json` (Zod-validated)
- [ ] Apply in `classifyThreadForUser` post-processor and webhook side effects
- [ ] Tests per rule

---

### Phase 5 — Send-time + focus integration (1 day) → **+4 points** (workflow #14 → ~78)

- [ ] `suggestSendTime`: penalize hours overlapping today’s calendar events (fetch from cached events query)
- [ ] Respect focus window: suggest next slot **after** focus block ends
- [ ] Composer UI: show “Suggested send: Tue 9:00am” chip from API

---

### Phase 6 — Workflow test suite (1.5 days) → **+5 points** (confidence, not feature)

- [ ] `gmail-event-filter` + handler: mock tenant, assert classify called once
- [ ] `scheduled-sends`: claim semantics, attachment cleanup on send
- [ ] `focus/auto-reply`: skip self, skip second same-day
- [ ] CI job: `bun test src/lib/__tests__` includes new specs

---

### Phase 7 — Optional: email analytics digest (1 day) → **+3 points** (gmail-workflows “analytics dashboard” lite)

Only if product wants weekly retention hook:

- [ ] Nightly aggregate: received/sent counts, top senders, lane distribution, avg snooze duration
- [ ] Monday brief section in daily brief OR separate email to self
- [ ] No Google Sheets dependency — app DB only

---

## Target scorecard (after plan)

| Workflow | Today | After Phase 1–6 | Ceiling |
|----------|------:|----------------:|--------:|
| Realtime triage | 82 | 88 | 92 |
| Commitments | 58 | 78 | 85 |
| Outbound attachments | 68 | 82 | 88 |
| Focus auto-reply | 65 | 76 | 82 |
| Send-time | 66 | 78 | 85 |
| User rules | — | 80 | 90 |
| **Overall Gmail** | **73** | **~90** | **94** |

---

## Out of scope (explicit)

These would not raise the **scheduling inbox** score meaningfully:

- Full invoice OCR pipeline  
- Slack notification bus  
- Gmail label sync as source of truth  
- Multi-account Gmail  

Revisit only if positioning shifts toward “Gmail automation hub.”

---

## Open decisions (grill-me candidates)

If prioritizing phases, align on:

1. **Drive attachment save** — user OAuth scope cost vs demo wow-factor  
2. **Commitment follow-up** — auto-send after N days vs always human review  
3. **User rules** — five presets vs full rule builder  

See [calendar-workflow-improvement-plan.md](./calendar-workflow-improvement-plan.md) for the calendar side.
