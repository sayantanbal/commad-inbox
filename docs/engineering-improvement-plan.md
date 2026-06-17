# Engineering Assessment & Improvement Plan

**Project:** Command Inbox  
**Assessed:** 2026-06-17  
**Overall score:** **71 / 100**

This score reflects a **strong hackathon / early-product foundation** with modern patterns and thoughtful security boundaries, held back by thin test coverage, a monolithic UI shell, broken lint tooling, and limited production observability. Max potential for this stack and scope is realistically **92–95** (100 requires sustained SRE investment, full E2E matrix, and multi-region hardening).

---

## Score breakdown

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Architecture & modularity | 15% | **74** | Clean `src/lib` domain split, Zod schemas, API helpers; `inbox-shell.tsx` is ~2,400 lines |
| Type safety & validation | 12% | **85** | `strict: true`, no `@ts-ignore`/`as any`, `strictObject` + bounded payloads at boundaries |
| API design & auth | 12% | **80** | Consistent `requireSessionApi` + `parseJsonBody`; a few routes duplicate auth inline |
| Security | 13% | **76** | Cron secret, webhook signatures, encrypted BYOK keys; in-memory rate limits, no CSP headers audit |
| Testing & QA | 18% | **38** | 43 unit tests / 10 files; 0 E2E; no route integration tests; no coverage gate |
| CI/CD & DevOps | 10% | **58** | CI runs tests + build; lint broken locally; no typecheck job, audit, or deploy smoke |
| Observability & ops | 10% | **32** | `console.error` only; no structured logging, tracing, or error reporting |
| Documentation & DX | 10% | **82** | Deploy guide, phase docs, Fumadocs site, `.env.example`; scripts excluded from `tsc` |

**Weighted total: 71 / 100**

---

## What is already strong

### 1. Boundary validation (exemplary for this size)

API routes follow a repeatable pattern:

```14:22:src/app/api/inbox/send/route.ts
export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = checkSendRateLimit(auth.userId);
  if (rateLimited) return rateLimited;

  const parsed = await parseJsonBody(request, sendBodySchema);
  if (!parsed.ok) return parsed.response;
```

`parseJsonBody` returns structured Zod `fieldErrors`. Schemas use `strictObject`, size limits, and bounded JSON instead of `z.unknown()` — backed by dedicated tests in `schema-hardening.test.ts`.

### 2. Environment & phased boot

`src/lib/env.ts` validates at startup with phase helpers (`assertPhase1Env`, `assertPhase2Env`). `.env.example` documents phases clearly. This prevents silent misconfiguration.

### 3. Data layer

- Drizzle ORM with 15 SQL migrations, pgvector, proper indexes and FK cascades
- Better Auth + per-user Corsair tenant isolation
- Cron jobs in `vercel.json` with bearer-token guard

### 4. CI baseline works

```21:25:.github/workflows/ci.yml
      - name: Unit tests
        run: bun test src/lib/__tests__

      - name: Production build
        run: bun run build
```

All 43 tests pass; production build succeeds.

### 5. Documentation culture

`docs/deploy.md`, webhook guides, demo script, and `apps/docs` Fumadocs site give judges and contributors a real onboarding path — uncommon at this stage.

---

## Critical gaps (why not higher)

### 1. Testing pyramid is inverted

| Layer | Current | Target |
|-------|---------|--------|
| Unit | 43 tests, lib-only | 150+ across lib + schemas + pure UI helpers |
| Integration | 0 | Route handlers with mocked DB/Corsair |
| E2E | 0 | 8–12 Playwright flows (auth, send, agent, schedule) |
| Coverage gate | None | 60% lib, 40% routes (ratchet up) |

~47 API route files, ~134 lib modules, one 2,400-line component — tests cover **<10%** of behavioral surface.

### 2. `inbox-shell.tsx` is a maintainability risk

Single component owns: thread list, calendar, agent panel, commitments, snooze, composer, search, settings, mobile tabs, keyboard shortcuts, and most client state. This blocks parallel work, makes regressions likely, and prevents meaningful component tests.

### 3. Tooling debt

- `bun run lint` fails (`@next/eslint-plugin-next` missing)
- Lint is **not** in CI
- `tsconfig.json` excludes `scripts/` — CLI/migration scripts are untyped
- No Husky / lint-staged pre-commit

### 4. Production ops gaps

- Rate limiting uses an in-process `Map` — ineffective on Vercel serverless (per-instance buckets)
- `process-due` cron loads **all users** every minute — won't scale past hundreds of users
- No `/api/health` or readiness probe
- Webhook/async failures only hit `console.error`
- Migrations are manual (`docs/deploy.md` explicitly says so)

### 5. Inconsistent auth helper usage

Most routes use `requireSessionApi`; `search/route.ts` and `search/advanced/route.ts` inline `auth.api.getSession` and skip the Google-connection check. Small drift today, security footgun tomorrow.

### 6. No error boundaries

No `error.tsx` or React error boundaries in the app tree. A single client throw can blank the inbox.

---

## Roadmap to max potential

Phases are ordered by **risk reduction per effort**. Each phase has a target score bump.

```
71 ──► Phase 1 (78) ──► Phase 2 (84) ──► Phase 3 (89) ──► Phase 4 (93+) 
         tooling          testing           refactor          production
```

---

## Phase 1 — Tooling & CI hardening (2–3 days)

**Target score: 78**

| # | Task | Acceptance criteria |
|---|------|---------------------|
| 1.1 | Fix ESLint setup | Add `@next/eslint-plugin-next`; migrate off deprecated `next lint` to `eslint .` |
| 1.2 | Extend CI | Add jobs: `lint`, `tsc --noEmit`, `bun audit` (or OSV) |
| 1.3 | Typecheck scripts | Include `scripts/` in tsconfig or add `tsconfig.scripts.json` |
| 1.4 | Pre-commit | Husky + lint-staged: lint + test on changed files |
| 1.5 | Health endpoint | `GET /api/health` → `{ ok, db, version }` with DB ping |
| 1.6 | Unify API auth | Refactor search routes to `requireSessionApi`; add ESLint rule or codemod grep in CI |

**Files to touch:** `package.json`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `src/app/api/search/*`, new `src/app/api/health/route.ts`

---

## Phase 2 — Testing pyramid (1–2 weeks)

**Target score: 84**

### 2A. Unit expansion (days 1–3)

Add tests for high-risk pure logic not yet covered:

- `src/lib/inbox/scheduled-sends.ts` — queue, cancel, dispatch timing
- `src/lib/classifier/classify-thread.ts` — lane mapping (mock AI)
- `src/lib/gmail/outbound-attachment.ts` — limits, mime allowlist
- `src/lib/corsair/connection.ts` — tenant connection states
- `src/lib/commitments/extract.ts` — schema round-trips
- `src/lib/inbox/client-api.ts` — request shape builders

**Target:** 100+ unit tests.

### 2B. Route integration tests (days 4–7)

Create `src/app/api/__tests__/` with Bun test + mocked session:

```ts
// Pattern: mock requireSessionApi + db + corsair, call route handler directly
import { POST } from "../inbox/send/route";
```

Priority routes (highest blast radius):

1. `/api/inbox/send` — undo window, attachments
2. `/api/agent/chat` — payload bounds, rate limit
3. `/api/webhooks` — tenantId validation, bad signature
4. `/api/cron/process-due` — CRON_SECRET guard
5. `/api/inbox/ai-keys` — encryption round-trip
6. `/api/inbox/contacts/import` — strict schema

**Target:** 30+ integration tests.

### 2C. E2E with Playwright (days 8–10)

Install Playwright; run against `next dev` in CI with test DB + mocked Google (or dedicated test tenant).

Critical flows:

| Flow | Why |
|------|-----|
| Sign-in redirect | Middleware + auth |
| Onboarding connect (mocked) | Tenant creation |
| Open thread → archive | Core loop |
| Compose → send with undo | Scheduled send |
| Agent chat (mock LLM) | Streaming + tools |
| Semantic search | AI + index banner |

Store fixtures in `e2e/fixtures/`; use `CRON_SECRET` + test user seed script.

**Target:** 10 E2E specs; run on PR to `main`.

### 2D. Coverage gate

```json
// package.json
"test:coverage": "bun test --coverage src"
```

CI fails if lib coverage drops below 55% (ratchet +5% per sprint).

---

## Phase 3 — Decompose the monolith (1–2 weeks)

**Target score: 89**

Split `inbox-shell.tsx` by **vertical slice**, not arbitrary file size:

```
src/components/inbox/
  shell/
    inbox-shell.tsx          # layout + providers only (~200 lines)
    use-inbox-threads.ts     # thread list state + mutations
    use-inbox-calendar.ts    # events, free-busy, defrag
    use-inbox-agent.ts       # agent panel, scheduling bridge
    use-inbox-commitments.ts
    use-inbox-keyboard.ts    # shortcuts from lib/shortcuts.ts
    inbox-workspace.tsx      # panel router (welcome | thread | calendar)
```

**Rules:**

- Each hook owns React Query keys and API calls for its domain
- Move fetch logic to existing `src/lib/inbox/client-api.ts`
- `InboxShell` only composes hooks + layout; no business logic
- Add Storybook or Ladle for isolated panel stories (optional but high leverage)

**Acceptance:** `inbox-shell.tsx` < 300 lines; no file in `components/inbox/` > 500 lines.

---

## Phase 4 — Production hardening (2–3 weeks)

**Target score: 93+**

### 4A. Distributed rate limiting

Replace in-memory `Map` with **Upstash Redis** or Vercel KV:

```ts
// src/lib/api/user-rate-limit.ts
// sliding window per userId+endpoint, survives cold starts
```

Apply to all AI and send endpoints.

### 4B. Cron scalability

Refactor `process-due`:

- Query only users with `scheduled_sends.send_at <= now()` (indexed)
- Batch size limit (e.g. 50 users per invocation)
- Idempotency key on send dispatch
- Dead-letter row for failed sends (already have `failed` enum — surface in UI)

Same pattern for `renew-watches` and nightly backfill.

### 4C. Observability

| Layer | Tool | What to capture |
|-------|------|-----------------|
| Errors | Sentry | API 500s, agent stream failures, webhook handler catches |
| Logs | Axiom / Vercel Log Drain | structured JSON: `userId`, `route`, `durationMs` |
| Traces | OpenTelemetry → Honeycomb | Corsair calls, AI `streamText`, DB queries |
| Metrics | Vercel Analytics + custom | send latency, classify queue depth, cron duration |

Add `src/lib/observability/logger.ts` — single interface, no raw `console.log` in lib code.

### 4D. Security pass

- [ ] Security headers middleware (CSP, `X-Frame-Options`, `Referrer-Policy`)
- [ ] Audit all API routes for auth (automated test enumerates routes)
- [ ] Dependabot / Renovate for dependency updates
- [ ] STRIDE review on agent tool approval flow (attachments plan)
- [ ] Rate limit on `/api/webhooks` by IP

### 4E. Deploy automation

- GitHub Action: on release tag → `bun run db:migrate` against Neon (with approval gate)
- Post-deploy smoke: hit `/api/health`, run `scripts/smoke-corsair.ts`
- Staging environment in Vercel with separate Neon branch

### 4F. Error UX

- `src/app/inbox/error.tsx` — recoverable inbox error with retry
- `src/app/global-error.tsx` — fallback UI
- Toast for API `fieldErrors` from Zod (already structured — wire in client)

---

## Phase 5 — Advanced engineering (ongoing)

**Target score: 95+** (diminishing returns; pick based on product direction)

| Initiative | Value |
|------------|-------|
| Feature flags (e.g. LaunchDarkly / Vercel Flags) | Safe rollout of agent tools |
| Background job queue (Inngest / Trigger.dev) | Replace fire-and-forget webhook handlers |
| Read replicas + connection pooling audit | Neon pooler already — add query timing |
| Contract tests for Corsair/Gmail responses | Recorded fixtures, replay in CI |
| Performance budget in CI | Lighthouse on `/inbox`, bundle size limit |
| ADRs in `docs/adr/` | Document tenant model, AI key encryption, cron design |

---

## Priority matrix

```
                    HIGH IMPACT
                        │
    Phase 2B route      │     Phase 3 shell
    integration tests   │     decomposition
                        │
  ──────────────────────┼────────────────────── HIGH EFFORT
                        │
    Phase 1 lint/CI     │     Phase 4C observability
                        │
                    LOW IMPACT
```

**Do first:** Phase 1 (all) + Phase 2B routes 1–4 + Phase 4A rate limits.  
**Do next:** Phase 2C E2E + Phase 3 shell split.  
**Defer until scale:** Phase 4B cron batching (needed before ~500 active users).

---

## Success metrics

Track weekly until score ≥ 90:

| Metric | Now | Phase 2 | Phase 4 |
|--------|-----|---------|---------|
| Unit + integration tests | 43 | 130+ | 180+ |
| E2E specs | 0 | 10 | 15+ |
| CI jobs passing | 2/2 | 5/5 | 6/6 |
| Largest component (lines) | 2,397 | 2,397 | < 300 |
| API routes with schema validation | ~30/47 | 47/47 | 47/47 |
| P95 agent chat latency (prod) | unknown | — | < 8s |
| Error reporting coverage | 0% | — | 100% API 500s |

---

## Quick wins (this week)

If you only have a few hours, do these five items for the best score lift:

1. **Fix lint** — install missing plugin, add to CI (~30 min)
2. **Add `/api/health`** — DB ping (~20 min)
3. **Unify search auth** — use `requireSessionApi` (~15 min)
4. **10 route integration tests** — send, webhooks, cron, agent chat (~3 hrs)
5. **Extract `use-inbox-keyboard.ts`** from shell — first decomposition slice (~2 hrs)

Estimated lift from quick wins alone: **71 → 76**.

---

## Summary

Command Inbox is **well-engineered for its stage**: modern stack, strict validation, thoughtful multi-tenancy, and real docs. The gap to max potential is not architectural rewrites — it is **verification** (tests), **operability** (logs, metrics, health), and **maintainability** (split the shell, fix tooling).

Following this plan through Phase 4 yields a codebase that is defensible in production, pleasant to extend, and credible to investors or acquirers — without changing the product vision.
