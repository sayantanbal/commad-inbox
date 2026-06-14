# Hackathon submission checklist

Use this when submitting **Command Center Builder** (MacBook Giveaway Hackathon).

## Required deliverables

| Item | Status | Link |
|------|--------|------|
| Open-source GitHub repo | ✅ | https://github.com/sayantanbal/commad-inbox |
| Live deployed app | ☐ | https://command-inbox.sayantanbal.in |
| Demo video (YC-style, ~90s) | ☐ | _add YouTube/Loom URL_ |
| X/Twitter post | ☐ | _add post URL_ |
| LinkedIn post | ☐ | _add post URL_ |
| Short README | ✅ | [README.md](../README.md) |
| Corsair features used | ✅ | [README — Corsair features](../README.md#corsair-features-used) |
| Bonus tasks attempted | ✅ | [README — Bonus rubric](../README.md#bonus-tasks-attempted) |

## Demo video script

Follow [demo-script.md](./demo-script.md). Cover:

1. Problem (Gmail + Calendar friction)
2. AI triage lanes
3. Hero workflow (`M` → invite + draft)
4. Agent chat with approval UI
5. Semantic + advanced search
6. Stack and Corsair usage

## Social posts

Copy from [social-post.md](./social-post.md). Tag **ChaiCode**, **Hitesh Sir**, **Piyush**, and **Corsair**. End with:

> Builder Mode On | MacBook Giveaway Hackathon

Hashtags: `#chaicode` `#corsair-dev`

## Judge OAuth

Add judge emails as Google OAuth test users — see [judge-oauth.md](./judge-oauth.md).

## Pre-submit smoke test

```bash
bun install
bun run build
bun test
bun run smoke:corsair   # optional — needs DATABASE_URL
```

Live checklist (see [deploy.md](./deploy.md#6-post-deploy-smoke-test)):

1. Sign in → connect Google
2. Threads load on `/inbox`
3. Press `M` on a scheduling thread → invite + draft
4. Agent: send calendar invite + email (approve previews)
5. `/` semantic search, `Mod+Shift+F` advanced search
6. Send yourself email → lane updates within ~30s
