# Path to 98+ — Command Inbox Hackathon Plan

> **Based on:** strict audit in [`HACKATHON_JUDGE_AUDIT.md`](./HACKATHON_JUDGE_AUDIT.md) + grill-me design decisions (2026-06-14)  
> **Current score (strict):** 64/100  
> **Target:** 98+ with near-flawless execution  
> **Time budget:** 1+ week  
> **Submission artifacts (video, deploy, social):** final step

---

## Executive summary

**98+ is theoretically possible but requires near-perfect execution on every rubric criterion.** With strict judging, a realistic outcome after full implementation is **93–97**; **98+** additionally depends on human panel taste agreeing the M-key + NL-calendar flow is genuinely better than Gmail+Calendar.

**Core strategy (one sentence):**

> Own one story: *"Scheduling email is 10+ clicks in Google; in Command Inbox it's `M` → pick slot → invite + draft — and the agent uses the same pipeline."* Prove it on camera with webhook → lane → M-key → Calendar → agent → full-index search.

---

## Grill-me decisions (locked)

| Decision | Choice | Notes |
|----------|--------|-------|
| Time budget | **1+ week** | Enough time if scope stays ruthless |
| Demo hero | **M-key** — thread → slot → invite + draft | Provable step reduction vs Gmail+Calendar |
| Vector / search scope | **Full INBOX index** into pgvector | Revised from initial "keep 50" — required for 95+ |
| Corsair purity | **Zero bypass** | All Google calls through Corsair tenant token gateway |
| Calendar depth | **NL calendar unified** — M-key + agent + conflicts as one flow | Highest calendar/AI lift |
| Engineering bar | **Production grade** | Rate limits, webhook auth, green CI, E2E, monolith addressed |
| Demo proof | **Full proof** on camera | Webhook → lane → send → invite visible in Gmail + Calendar |
| Demo recording URL | **Production only** | Rehearse on local/ngrok until deploy; final take on command-inbox.sayantanbal.in |
| Demo deploy timing | **Day before record** | Deploy evening → demo account indexes overnight → record next morning |
| Scope in demo | **Core only** | Lanes, M, agent, search — extras in README only |
| Indexing UX | **Async + pre-seeded judge account** (recommended) | Inbox usable immediately; demo account fully indexed |

### Resolved contradiction

Initial choice **"keep 50-thread semantic search"** caps score at **~88–92** even if everything else is perfect (README overclaims full-mailbox search; bonus vector task marked partial).

**Resolution:** background job to index **entire INBOX** into pgvector; advanced search (`Mod+Shift+F`) remains the Gmail-history path via Corsair `threads.list({ q })`.

---

## Score map: today → target

| Criterion | Max | Today | Target | What unlocks the top |
|-----------|----:|------:|-------:|----------------------|
| param-1 Corsair Integration | 20 | 13 | **18–19** | Zero bypass; verified webhooks; calendar fetch on push |
| param-2 Gmail Workflow | 15 | 11 | **14–15** | Full index; M-key hero; live webhook lane updates in demo |
| param-3 Calendar Workflow | 15 | 10 | **14–15** | NL unified scheduling; conflict UI; webhook event sync |
| param-4 Productivity UX | 15 | 11 | **14–15** | ≤3 interactions to schedule; keyboard demo on camera |
| param-5 AI and MCP Usage | 15 | 11 | **14–15** | Agent + M-key share pipeline; approval on send/invite |
| param-6 Engineering Quality | 10 | 5 | **9–10** | API rate limits; webhook auth; green CI; E2E smoke |
| param-7 Demo and Documentation | 10 | 3 | **9–10** | YC video with full proof; live deploy; social posts |
| **TOTAL** | **100** | **64** | **93–98** | See forecast below |

### Score forecast by execution quality

| Execution | Total |
|-----------|------:|
| P0+P1 only (no full index, no NL calendar) | ~78–82 |
| Plan ~80% complete | ~90–93 |
| Plan ~95% + strong video | **93–96** |
| Near-perfect + favorable strict judge | **97–98** |
| 99–100 | Unrealistic — reserved for zero cited gaps |

---

## 1-week execution plan (dependency order)

### Days 1–2 — Engineering floor (param-6 → 9)

Priority: security and CI credibility before feature expansion.

- [x] **API rate limits** on `POST /api/agent/chat`, `POST /api/inbox/send`, `POST /api/inbox/draft` (per-user sliding window)
- [x] **Calendar webhook auth** — verify `X-Goog-Channel-Token` (store token at `events.watch` registration)
- [x] **Fix 2 failing tests** — extract `shouldClassifyGmailEvent` to `gmail-event-filter.ts`
- [x] **CI green** — `bun test src/lib/__tests__` + `bun run build` must pass in `.github/workflows/ci.yml`

**Evidence targets:** `src/lib/api/user-rate-limit.ts`; `src/app/api/webhooks/calendar/route.ts`; `src/lib/webhooks/verify-calendar-channel.ts`; 17/17 tests passing.

---

### Days 2–4 — Full INBOX index (param-2 + vector bonus → 14–15)

- [x] **Background indexer** — paginate all INBOX threads via Corsair `threads.list`, classify + embed each
- [x] **Progress UI** — activity bar: "Indexing 312 more threads… (88/400)" (`full-index-progress` events)
- [x] **Async on connect** — last 50 lanes immediately (`runQuickBackfill`); full index continues in background
- [x] **Pre-seed judge demo account** — documented in `docs/judge-oauth.md` (operational: run before video)
- [x] **README honesty** — semantic (`/`) vs advanced (`Mod+Shift+F`) distinction in README + search overlay
- [x] **Partial semantic search during indexing** — `/` searches embedded threads while full INBOX index runs

**Remove or qualify claims:** "sub-second search across entire email" unless benchmarked on camera with real thread count.

**Key files to extend:** `src/lib/backfill/inbox-backfill.ts`, `src/lib/search/semantic.ts`, `src/lib/embeddings/reembed-inbox.ts`.

---

### Days 3–5 — Zero Corsair bypass (param-1 → 18)

Goal: no scattered `fetch("https://…googleapis.com")` in feature code.

- [x] **Single gateway** — `src/lib/corsair/google-proxy.ts` — Google REST via Corsair tenant tokens
- [x] **free/busy** — replaced with Corsair `events.getMany` (`corsair-events-busy.ts`)
- [x] **watch registration** — `registerGmailWatchViaProxy` / `registerCalendarWatchViaProxy` (no native Corsair watch API found)
- [x] **contacts** — People API + OAuth token via gateway; **demo contacts** optional (`demo-contacts.ts`)

**Acceptable for 98+:** HTTP to Google may still occur if every call flows through one Corsair-token gateway — not zero HTTP, zero *uncontrolled* bypass.

---

### Days 4–6 — NL calendar unified (param-3 + param-5 → 14–15)

- [x] **Webhook fetch** — calendar push → Corsair `events.getMany` → Pusher payload refreshes week strip
- [x] **Conflict modal** — free/busy overlap before M-key confirm (`schedule-overlap-modal.tsx` path)
- [x] **Agent ↔ M-key bridge** — agent proposes slot → availability picker → same invite + draft pipeline
- [x] **Reschedule in-place** — `M` on linked thread → confirm modal → PATCH updates event (no 409 on create path)

**Demo narrative:** two entry points (keyboard + natural language), one scheduling pipeline.

---

### Days 6–7 — Demo, deploy, social (param-7 → 9–10)

Final step per your plan.

- [ ] **Deploy** production — https://command-inbox.sayantanbal.in (or final URL)
- [ ] **Judge OAuth** — test users added (`docs/judge-oauth.md`)
- [ ] **90s YC-style video** — script below
- [ ] **X + LinkedIn posts** — `docs/social-post.md` (tags: ChaiCode, Hitesh, Piyush, Corsair; `#chaicode` `#corsair-dev`; closing line required)
- [ ] Paste URLs into `README.md` and `docs/submission.md`

#### Demo video script (90s, full proof)

| Time | Beat | Proof required |
|------|------|----------------|
| 0–15s | Problem — scheduling = 10+ clicks across Gmail + Calendar | Talking head or screen recording |
| 15–30s | Webhook — send yourself email → lane updates live | Split screen or refresh; show Reply/Schedule/FYI |
| 30–50s | **M-key hero** — thread → slot → invite + draft | Google Calendar shows new event + Meet link |
| 50–65s | Agent — NL send + invite → approve previews → send | Same pipeline as M-key |
| 65–80s | Search — `/` semantic (indexed count visible) + `Mod+Shift+F` advanced | Query real mail |
| 80–90s | Stack — Corsair, pgvector, MCP, keyboard UX | Architecture slide or README |

#### Live smoke checklist (before recording)

1. Sign in → connect Google  
2. Threads load on `/inbox`  
3. `M` on scheduling thread → invite + draft  
4. Agent: calendar invite + email with approval  
5. `/` semantic + `Mod+Shift+F` advanced  
6. Send email → lane updates within ~30s  

---

### Parallel — production-grade extras

- [ ] **Playwright E2E** — sign-in → connect → send → M-key invite  
- [ ] **Address `inbox-shell.tsx` monolith** (2,227 lines) — split or add architecture justification in docs  
- [x] **Update `docs/whats-done.md`** — test count and phase status must match CI  

---

## What to show vs hide in demo

| Show (core) | Mention in README only |
|-------------|------------------------|
| AI triage lanes | Commitments / Waiting For |
| M-key scheduling | People CRM |
| Agent chat + approval | Linear export |
| Semantic + advanced search | Focus blocks (unless 5s demo beat) |
| Keyboard shortcuts (`?`) | Send-time optimizer |
| Webhook realtime | Multi-provider AI fallback details |

---

## Remaining risks (even with perfect execution)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Strict judge taste | 98+ often needs human override | Nail M-key timing comparison vs Gmail |
| Cold-connect indexing delay | Judge searches before index done | Pre-seed judge account; async UI with progress |
| Residual `googleapis.com` calls | −1 to −2 param-1 | Single `google-proxy` gateway |
| Scope creep in repo | −1 param-4 if judge greps extras | Demo core only; don't tour People/Linear |
| Live deploy / webhook flake | −1 param-7 | Smoke test day-of; fallback recording if live fails |
| CI / test drift | −1 to −2 param-6 | Keep `whats-done.md` synced with `bun test` |

---

## Claim accuracy checklist (avoid audit mismatches)

| Don't claim | Do claim |
|-------------|----------|
| "Search entire mailbox" without full index complete | "Semantic search over indexed threads; advanced search for full Gmail history" |
| "Rate limiting" for provider 429 fallback only | "Per-user API rate limits on chat/send/draft" (after implemented) |
| "9 tests passing" | Actual count from `bun test` |
| Dedicated "Corsair Search API" | "Gmail search via Corsair `threads.list({ q })`" |
| "Realtime webhooks only" | "Webhooks + Pusher; 60s poll fallback when configured" |

---

## Success criteria (definition of done for 98+ attempt)

- [ ] All rubric param targets in score map met with cited evidence  
- [ ] `HACKATHON_JUDGE_AUDIT.md` blockers P0 + P1 + P2 resolved  
- [ ] Full INBOX index working; judge demo account pre-indexed  
- [ ] Zero uncontrolled Google API bypasses  
- [ ] NL calendar: agent and M-key share one scheduling pipeline  
- [ ] CI: 100% tests pass, build passes  
- [ ] Demo video shows **full proof** chain on real Gmail + Calendar  
- [ ] Live URL 200; social posts published with required tags  

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`HACKATHON_JUDGE_AUDIT.md`](./HACKATHON_JUDGE_AUDIT.md) | Strict baseline audit (64/100) |
| [`CORSAIR_HACKATHON_JUDGE_PROMPT.md`](./CORSAIR_HACKATHON_JUDGE_PROMPT.md) | Official rubric + judge prompts |
| [`docs/submission.md`](./docs/submission.md) | Deliverables checklist |
| [`docs/demo-script.md`](./docs/demo-script.md) | Video timestamps |
| [`docs/social-post.md`](./docs/social-post.md) | LinkedIn + X copy |
| [`docs/judge-oauth.md`](./docs/judge-oauth.md) | OAuth test users |

---

## Next implementation step

**Phase 0–4 complete (code).** Phase 5 is **operational** — you execute, repo docs are ready:

| Step | Owner | Doc |
|------|-------|-----|
| Deploy + smoke test | You | [deploy.md](./docs/deploy.md), [submission.md](./docs/submission.md) |
| Pre-index demo Gmail | You | [judge-oauth.md](./docs/judge-oauth.md) |
| Record raw 90s video | You | [demo-script.md](./docs/demo-script.md) |
| Social posts | You | [social-post.md](./docs/social-post.md) |
| Paste URLs in README | You | [submission.md](./docs/submission.md) |

Run migrations before production:

```bash
bun run db:migrate
```

Existing users must **renew calendar watches** once (reload `/inbox` or run `bun scripts/renew-watches.ts`) so channel tokens are stored for webhook auth.
