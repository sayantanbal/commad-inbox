# Production deploy — Vercel + Neon

Command Inbox targets **Vercel** (app) + **Neon Postgres** (database with pgvector). Gmail webhooks use your production URL — no ngrok in prod.

## Prerequisites

- [Neon](https://neon.tech) project with Postgres 16+
- [Vercel](https://vercel.com) account linked to this repo
- Google Cloud project with Gmail + Calendar OAuth (Testing mode OK for judges)
- GCP Pub/Sub topic for Gmail push (see [phase2-webhooks.md](./phase2-webhooks.md))
- Pusher Channels app (optional; 5s poll fallback if omitted)
- At least one platform AI key recommended: `OPENAI_API_KEY` and/or `GOOGLE_GENERATIVE_AI_API_KEY` (users can also BYOK in Settings → AI)

## 1. Neon database

1. Create a project → copy the **pooled** connection string.
2. Enable pgvector (Neon console → Extensions → `vector`, or run migrations which include `001_extensions.sql`).
3. From your machine with `DATABASE_URL` set to the Neon URL:

```bash
bun run db:migrate
bun run corsair:setup
```

Keep `CORSAIR_KEK` stable — changing it after setup requires `bun run corsair:reset`. This key also encrypts user-supplied AI API keys at rest.

## 2. Vercel project

1. Import the GitHub repo in Vercel.
2. Framework preset: **Next.js** ( `vercel.json` sets `bun install` / `bun run build`).
3. Add **all** variables from `.env.example` under Project → Settings → Environment Variables.

Production values that differ from local:

| Variable | Production value |
|----------|------------------|
| `BETTER_AUTH_URL` | `https://your-app.vercel.app` |
| `APP_URL` | `https://your-app.vercel.app` |
| `DATABASE_URL` | Neon pooled connection string |
| `GMAIL_PUBSUB_TOPIC` | `projects/<gcp-project>/topics/<topic-name>` |

Generate once and store securely:

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -base64 32   # CORSAIR_KEK
openssl rand -base64 32   # CRON_SECRET
```

4. Deploy. First deploy runs the Next.js build only — **migrations are not automatic**. Run `bun run db:migrate` against Neon before or immediately after first deploy.

## 3. Google OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:

**Authorized JavaScript origins**

```
https://your-app.vercel.app
```

**Authorized redirect URIs**

```
https://your-app.vercel.app/api/auth/callback/google
https://your-app.vercel.app/api/auth/callback/corsair
```

Add judge emails as **Test users** while the app stays in Testing mode. See **[judge-oauth.md](./judge-oauth.md)** for a copy-paste checklist.

## 4. Gmail Pub/Sub (production webhooks)

1. Create topic + IAM binding per [phase2-webhooks.md](./phase2-webhooks.md).
2. Set `GMAIL_PUBSUB_TOPIC` in Vercel env.
3. After deploy, each user’s Gmail watch uses `APP_URL`:

```
https://your-app.vercel.app/api/webhooks
```

Re-run connect flow or `bun run gmail:watch` locally against production DB if watches were created with ngrok URLs.

## 5. Scheduled jobs (send-later + snooze expiry)

Vercel Hobby cron is daily-only. Use an external pinger every **1 minute**:

**cron-job.org (free)**

- URL: `https://your-app.vercel.app/api/cron/process-due`
- Method: `POST`
- Header: `Authorization: Bearer <CRON_SECRET>`

**Upstash QStash** works similarly if you prefer a queue.

## 6. Post-deploy smoke test

Run locally before deploy:

```bash
bun run smoke:submission   # unit tests + agent eval + build
bun run build
bun test
```

After deploy, run automated prod checks (sign-in, DB, Pusher, Pub/Sub, AI keys):

```bash
bun run smoke:prod
# optional override: PROD_SMOKE_URL=https://your-app.vercel.app bun run smoke:prod
```

`GET /api/health` returns `{ ok, db, integrations: { pusher, gmailPubSub, openai, gemini } }`.

Live checklist (manual — requires your Google account):

1. Open `https://your-app.vercel.app/sign-in` → Google sign-in
2. Connect Gmail + Calendar on `/onboarding/connect`
3. Confirm threads load on `/inbox`
4. Send yourself an email → webhook should classify within ~30s (check Vercel logs for `/api/webhooks`)
5. Press `/` for semantic search after backfill completes
6. Press `Mod+Shift+F` for advanced Gmail search

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| 500 on sign-in | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, OAuth redirect URIs |
| Empty inbox after connect | Run `bun run corsair:setup` against prod DB; check Corsair tables |
| Webhooks never fire | Pub/Sub topic IAM; `GMAIL_PUBSUB_TOPIC`; watch registered with prod `APP_URL` |
| AI features 503 | Add platform keys in Vercel **or** have the user save a Gemini/OpenAI key under Settings → AI |
| Send-later never sends | Configure cron-job.org → `/api/cron/process-due` with `CRON_SECRET` |

## Optional: deploy from CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.production.local   # sync env for local prod debugging
vercel --prod
```

Migrations always run locally/CI against `DATABASE_URL`, not inside the Vercel build.
