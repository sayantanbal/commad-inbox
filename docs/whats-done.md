# What's Done — Command Inbox

Status snapshot against [Command Inbox Product Plan](../.cursor/plans/command_inbox_product_plan_7b9adbaf.plan.md).  
Last updated: **2026-06-14**.

## Executive summary

| | |
|---|---|
| **Overall stage** | **Phase 6 — ship prep** (implementation ~complete; submission artifacts outstanding) |
| **Code** | Phases 0–5 implemented in repo; Phase 6 polish/docs largely done |
| **Blockers to submit** | Demo video, published social posts, production smoke-test sign-off |
| **Tests** | 9 unit/smoke tests passing (`bun test src/lib/__tests__`); no property/integration suite |
| **Plan file todos** | Frontmatter still marks all phases `pending` — **stale**; use this doc instead |

---

## Phase status

| Phase | Plan goal | Status | Notes |
|-------|-----------|--------|-------|
| **0 — Setup** | Scaffold, Corsair, DB, verify API calls | ✅ Done | `phase0` script, 8 Drizzle migrations, CI build+test |
| **1 — Auth + core inbox** | Sign-in, connect, threads, calendar, send/reply/archive | ✅ Done | Better Auth, `/onboarding/connect`, `/inbox` |
| **2 — Webhooks + triage** | Realtime sync, classifier, lanes, pgvector search | ✅ Done | Pusher, 50-thread backfill, `/` semantic search |
| **3 — Hero workflow** | `M` → availability → invite + draft | ✅ Done | Manual fallback when intent confidence &lt; 0.5 |
| **4 — Palette + shortcuts** | `Mod+K`, registry, cheat sheet, PWA/touch | ✅ Done | `react-hotkeys-hook`, swipe rows, mobile tabs |
| **5 — MCP agent** | Chat panel, approval flow, example prompt | ✅ Done | `/api/agent/chat`, `AgentToolApproval` |
| **6 — Ship** | Advanced search, deploy, README, demo video | 🟡 Partial | Docs/README/deploy ready; **video + posts not shipped** |

Legend: ✅ Done · 🟡 Partial · ☐ Not started

---

## Phase 0 — Setup

| Item | Status | Evidence |
|------|--------|----------|
| Next.js 15 + App Router + TypeScript | ✅ | `package.json`, `src/app/` |
| Drizzle ORM + Postgres schema | ✅ | `src/lib/db/schema.ts`, `drizzle/*.sql` |
| pgvector extension | ✅ | `classifications.embedding` vector column |
| Corsair SDK + Gmail + GCal plugins | ✅ | `corsair`, `@corsair-dev/gmail`, `@corsair-dev/googlecalendar` |
| Corsair MCP package | ✅ | `@corsair-dev/mcp` |
| `multiTenancy: true` | ✅ | `src/lib/corsair/` |
| Env validation (Zod) | ✅ | `src/lib/env.ts` |
| Real API smoke test | ✅ | `scripts/smoke-corsair.ts`, `bun run smoke:corsair` |
| CI (install, test, build) | ✅ | `.github/workflows/ci.yml` |
| LinkedIn + X launch posts | 🟡 | Draft in [social-post.md](./social-post.md); **not published** |

---

## Phase 1 — Auth + core inbox + calendar

| Item | Status | Evidence |
|------|--------|----------|
| Better Auth + Google OAuth | ✅ | `src/lib/auth.ts`, `/api/auth/[...all]` |
| Multi-tenant (`corsair_tenant_id` = `user.id`) | ✅ | `users.corsair_tenant_id` in schema |
| Connect Google (Gmail → Calendar back-to-back) | ✅ | `/api/connect/google`, `/onboarding/connect` |
| Unauthenticated `/inbox` → `/sign-in` | ✅ | `src/middleware.ts` |
| Thread list with lanes | ✅ | `thread-list.tsx`, triage lanes Reply/Schedule/FYI |
| Thread view (messages, timestamps) | ✅ | `thread-view.tsx` |
| Week-strip calendar | ✅ | `calendar-week-strip.tsx`, `/api/inbox/events` |
| Send / reply | ✅ | `composer-panel.tsx` (Tiptap), `/api/inbox/send` |
| Archive | ✅ | `/api/inbox/archive`, `E` shortcut |
| Restore from archive | ✅ | `/api/inbox/restore` |
| No mock data for logged-in users | ✅ | Real Corsair reads throughout |

---

## Phase 2 — Webhooks + AI triage

| Item | Status | Evidence |
|------|--------|----------|
| `POST /api/webhooks` + signature verification | ✅ | `src/app/api/webhooks/route.ts` |
| Gmail Pub/Sub + `GMAIL_PUBSUB_TOPIC` | ✅ | `docs/phase2-webhooks.md`, `scripts/gmail-watch.ts` |
| Priority + lane classifier (Gemini/OpenAI) | ✅ | `src/lib/classifier/` |
| Scheduling intent extraction (for Phase 3) | ✅ | `schedulingIntent` on `classifications` |
| Denormalized subject/sender/snippet for search | ✅ | `classifications` table |
| pgvector embeddings (`text-embedding-004` / OpenAI) | ✅ | `src/lib/embeddings/` |
| Semantic search (`/`) | ✅ | `/api/search`, search overlay in shell |
| Pusher realtime (`inbox-{tenantId}`) | ✅ | `src/lib/realtime/pusher.ts`, `use-inbox-realtime.ts` |
| 5s poll fallback | ✅ | Polling in `use-inbox-realtime.ts` |
| 50-thread backfill on connect | ✅ | `src/lib/backfill/inbox-backfill.ts` |
| Progress UI ("Setting up your inbox") | ✅ | `activity-bar.tsx` |
| Re-classify on every Gmail webhook | ✅ | `src/lib/webhooks/gmail-event.ts` |
| Embed async (fire-and-forget) | ✅ | Classifier persist path |

**Beyond original Phase 2 scope (bonus):**

| Item | Status | Evidence |
|------|--------|----------|
| Calendar webhooks | ✅ | `/api/webhooks/calendar` |
| Watch renewal cron | ✅ | `/api/cron/renew-watches`, `vercel.json` cron |
| Multi-provider AI + re-embed on switch | ✅ | `ai-provider-select.tsx`, `/api/inbox/reembed` |

---

## Phase 3 — Hero workflow

| Item | Status | Evidence |
|------|--------|----------|
| `M` opens availability picker | ✅ | `inline-availability-picker.tsx`, `inbox-shell.tsx` |
| Intent mode (proposed times from email) | ✅ | Uses `schedulingIntent` from classifier |
| Manual fallback (confidence &lt; 0.5 or null intent) | ✅ | Free slots, 30-min default, thread participants |
| Create calendar event via Corsair | ✅ | `/api/inbox/meeting` |
| AI confirmation draft queued for review | ✅ | Meeting route + composer integration |
| Invite update / cancel flows | ✅ | Meeting panel + calendar API |
| Undo send (5s delayed dispatch) | ✅ | `scheduled_sends`, undo toast in shell |
| Send later | ✅ | Composer presets + `/api/cron/process-due` |
| Snooze (filter-based, `S` key) | ✅ | `snoozes` table, `/api/inbox/snooze` |
| Bulk archive / snooze (`X`, long-press) | ✅ | Multi-select in shell + mobile |

**Beyond plan (bonus):**

| Item | Status | Evidence |
|------|--------|----------|
| Defrag my week | ✅ | `defrag-panel.tsx`, `src/lib/calendar/defrag.ts` |
| Focus block | ✅ | `/api/inbox/focus-block` |
| Daily brief | ✅ | `daily-brief-panel.tsx`, `/api/inbox/daily-brief` |
| Thread AI summary | ✅ | `/api/inbox/summary` |

---

## Phase 4 — Command palette + shortcuts

| Item | Status | Evidence |
|------|--------|----------|
| Typed shortcut registry (single source of truth) | ✅ | `src/lib/shortcuts.ts` |
| `react-hotkeys-hook` with scopes | ✅ | `inbox-shell.tsx` |
| Platform-adaptive modifier labels (⌘ vs Ctrl) | ✅ | `isMac` detection throughout |
| Single-key shortcuts J/K/E/R/M//?/X/S | ✅ | Registry + shell handlers |
| `Mod+K` command palette | ✅ | `command-palette.tsx` (cmdk) |
| `Mod+Shift+F` advanced search | ✅ | Advanced search overlay |
| `?` cheat sheet overlay | ✅ | `shortcut-cheatsheet.tsx` |
| Escape closes topmost layer | ✅ | Shell modal stack |
| Shortcuts disabled when input focused | ✅ | Hotkey `enableOnFormTags: false` + scopes |
| PWA manifest | ✅ | `src/app/manifest.ts` |
| Mobile bottom tabs (Inbox / Calendar / Agent / Brief) | ✅ | `mobile-tab-bar.tsx` |
| Swipe right = archive, swipe left = snooze | ✅ | `swipeable-thread-row.tsx` |
| FAB opens command palette on mobile | ✅ | `mobile-tab-bar.tsx` |

---

## Phase 5 — MCP agent chat

| Item | Status | Evidence |
|------|--------|----------|
| `POST /api/agent/chat` (Vercel AI SDK + streaming) | ✅ | `src/app/api/agent/chat/route.ts` |
| Corsair MCP tool discovery | ✅ | `src/lib/agent/mcp-tools.ts` |
| Approval-gated `send_email` / `create_calendar_invite` | ✅ | `agent-tool-approval.tsx` |
| Human-in-the-loop (`addToolResult` resume) | ✅ | Agent panel tool state handling |
| Read-only tools without approval | ✅ | Search / list availability paths |
| Agent chat panel in sidebar + mobile tab | ✅ | `agent-chat-panel.tsx` |
| Conversation persistence | ✅ | `/api/agent/conversations` |
| Example brief prompt path | ✅ | Schema tests + tool definitions in `agent-tools.ts` |

---

## Phase 6 — Polish + ship

| Item | Status | Evidence |
|------|--------|----------|
| Advanced search UI (Corsair Gmail API) | ✅ | `/api/search/advanced`, advanced overlay |
| Deploy guide (Vercel + Neon) | ✅ | [deploy.md](./deploy.md) |
| `vercel.json` (Bun build, cron routes) | ✅ | Root `vercel.json` |
| README + architecture diagram | ✅ | [README.md](../README.md) |
| Corsair features + bonus rubric | ✅ | README sections |
| Documentation site | ✅ | `apps/docs/`, docs.command-inbox.sayantanbal.in |
| Judge OAuth checklist | ✅ | [judge-oauth.md](./judge-oauth.md) |
| Submission checklist | ✅ | [submission.md](./submission.md) |
| Demo video script | ✅ | [demo-script.md](./demo-script.md) |
| **Demo video recorded & uploaded** | ☐ | URL placeholder in submission.md |
| **Live production smoke test signed off** | 🟡 | URL listed; checklist box unchecked |
| **X + LinkedIn posts published** | ☐ | Draft only in social-post.md |

---

## Bonus rubric (100-point hackathon)

| Bonus task | Status |
|------------|--------|
| MCP agent chat with approval UI | ✅ |
| Gmail + Calendar webhooks | ✅ |
| Command palette (`Mod+K`) | ✅ |
| Keyboard shortcut registry + cheat sheet | ✅ |
| AI priority triage lanes | ✅ |
| Corsair Gmail advanced search UI | ✅ |
| pgvector semantic search (`/`) | ✅ |
| PWA + mobile tabs / swipe gestures | ✅ |
| Send-later + snooze cron | ✅ |
| Multi-provider AI fallback | ✅ (extra vs locked Gemini-only plan) |

---

## Engineering quality

| Item | Status | Notes |
|------|--------|-------|
| TypeScript end-to-end | ✅ | Strict TS throughout |
| Zod at API boundaries | ✅ | `src/lib/schemas/` |
| Drizzle migrations | ✅ | 8 migration files |
| Service layer separation | ✅ | `src/lib/*` modules |
| Webhook signature verification | ✅ | Corsair `processWebhook` |
| CI green | ✅ | Tests + production build |
| Property tests (design doc) | ☐ | Not implemented |
| Broad integration test suite | ☐ | Only submission smoke tests |

---

## Deviations from locked plan decisions

| Locked decision | Actual | Impact |
|-----------------|--------|--------|
| Gemini only for AI | OpenAI primary + Gemini fallback | Better resilience; re-embed on provider switch |
| Skip `@better-auth/infra` | Package installed | Minor; core auth still Better Auth |
| Phase 2: no calendar webhooks | Calendar webhooks implemented | Extra realtime for calendar |
| Pusher channel `inbox-{tenantId}` | Implemented via `broadcastInboxEvent` | Matches intent |
| Vercel Hobby cron daily-only | `vercel.json` has minute cron | May work on paid tier; external pinger still documented |

---

## What's left before hackathon submit

Priority order:

1. **Record demo video** (~90s per [demo-script.md](./demo-script.md)) and add URL to [submission.md](./submission.md)
2. **Production smoke test** on https://command-inbox.sayantanbal.in (sign-in → connect → hero → agent → search → webhook)
3. **Publish social posts** from [social-post.md](./social-post.md); add post URLs to submission checklist
4. **Confirm judge emails** in Google OAuth test users ([judge-oauth.md](./judge-oauth.md))
5. **Optional:** Update plan file frontmatter todo statuses to reflect this doc

---

## Quick verification commands

```bash
bun install
bun test src/lib/__tests__
bun run build
bun run smoke:corsair   # needs real DATABASE_URL + Corsair setup
```

---

## Related docs

- [Product plan](../.cursor/plans/command_inbox_product_plan_7b9adbaf.plan.md)
- [Submission checklist](./submission.md)
- [Deploy guide](./deploy.md)
- [Implementation tasks (Kiro)](../.kiro/specs/command-inbox/tasks.md)
