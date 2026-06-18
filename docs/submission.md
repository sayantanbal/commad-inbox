# Hackathon submission checklist

Use this when submitting **Command Center Builder** (MacBook Giveaway Hackathon).

## Required deliverables

| Item | Status | Link |
|------|--------|------|
| Open-source GitHub repo | ✅ | https://github.com/sayantanbal/commad-inbox |
| Live deployed app | ✅ | https://command-inbox.sayantanbal.in |
| Demo video (YC-style, ~90s) | ☐ | _in progress — add YouTube/Loom URL_ |
| X/Twitter post | ✅ | https://x.com/sayantan_bal/status/2065756194409713738 |
| LinkedIn post | ✅ | https://www.linkedin.com/posts/sayantanbal_github-sayantanbalcommad-inbox-activity-7473281073972420608-U5-m |
| Short README | ✅ | [README.md](../README.md) |
| Corsair features used | ✅ | [README — Corsair features](../README.md#corsair-features-used) |
| Agent eval XML + Playwright approval test | ✅ | [`evaluations/inbox-agent.xml`](../evaluations/inbox-agent.xml), `e2e/agent-approval.spec.ts` |

## Demo video script

Follow **[demo-script.md](./demo-script.md)** — **raw 90s, single take, screen + voice only** (no edits).

Must show on camera:

1. Problem (Gmail + Calendar friction)
2. AI triage lanes + pre-staged webhook thread in Schedule
3. Hero workflow (`M` → slot → invite + draft)
4. Agent chat with approval UI (calendar + email)
5. `/` semantic + `Mod+Shift+F` advanced search
6. Stack: Corsair SDK, webhooks, MCP, pgvector
7. Close with live URL

Pre-staging checklist is in demo-script.md — **do not wait for live webhook on camera**.

## Social posts

Copy from [social-post.md](./social-post.md). Tag **ChaiCode**, **Hitesh Sir**, **Piyush**, and **Corsair**. End with:

> Builder Mode On | MacBook Giveaway Hackathon

Hashtags: `#chaicode` `#corsair-dev`

## Judge OAuth

Publish OAuth to **Production** (any Gmail) or add judge emails as **Test users** — see [judge-oauth.md](./judge-oauth.md).

## Pre-submit smoke test

```bash
bun install
bun run smoke:submission   # unit tests + agent eval fixtures + build
bun run smoke:prod         # after deploy — prod health + integrations
bun run validate:agent-eval
bun run test:e2e           # Playwright — agent approval harness (E2E_TEST=1)
bun run smoke:corsair      # optional — needs DATABASE_URL + OAuth tenant
```

Agent eval set: [`evaluations/inbox-agent.xml`](../evaluations/inbox-agent.xml) (10 read-only Q&amp;A pairs; validated against `evaluations/fixtures/`).

Full Phase 1–6 ops sequence: **[phase1-6-ops-runbook.md](./phase1-6-ops-runbook.md)** · `bun run phase1-6:preflight`

Agent prompt: [agent-rehearsal-prompt.txt](./agent-rehearsal-prompt.txt) · Seed emails: [demo-seed-emails.md](./demo-seed-emails.md)

1. Deploy `main` to production (`command-inbox.sayantanbal.in`)
2. Set `APP_URL` to production HTTPS on host
3. `bun run db:migrate` against prod DB
4. `bun scripts/renew-watches.ts` (after deploy)
5. Sign in with **dedicated demo Gmail** → connect Google
6. Leave app open or revisit until full index completes (overnight OK)

### Record day (morning)

See **[record-day-checklist.md](./record-day-checklist.md)** for video, social, and asset capture.

Live checklist (see [deploy.md](./deploy.md#6-post-deploy-smoke-test)):

1. Sign in → connect Google
2. Threads load on `/inbox`
3. Press `M` on a scheduling thread → invite + draft
4. Agent: send calendar invite + email (approve previews)
5. `/` semantic search, `Mod+Shift+F` advanced search
6. Send yourself email → lane updates within ~30s
