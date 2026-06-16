# Google OAuth — judge access (Testing mode)

Command Inbox uses a Google Cloud OAuth app in **Testing** mode. Only emails listed as **Test users** can sign in until the app is published.

## Before the demo

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**.
2. Under **Test users**, add every judge and reviewer email.
3. Confirm **Gmail API** and **Google Calendar API** are enabled for the project.
4. Confirm redirect URIs include your production URLs (see [deploy.md](./deploy.md)).

## Test users to add

Google OAuth **Testing** mode blocks sign-in for any account not on the allowlist. Judges may use **any** Gmail they choose (e.g. `username.spam@gmail.com`) — add each address in Cloud Console before they try to sign in.

There is no app-side email hard lock; the only gate is Google's test-user list.

```
# Add each judge/reviewer Gmail here before they connect:
judge@example.com
you@gmail.com
# Demo account (pre-index before recording):
demo@yourdomain.com
```

## Scopes requested

| Scope | Purpose |
|-------|---------|
| Gmail read/send/modify | Inbox, compose, archive, search |
| Calendar read/write | Events, invites, focus blocks |

## If a judge sees "Access blocked"

- Their email is not in **Test users** — add it and wait ~1 minute.
- They signed in with a different Google account than the one you added.
- Production `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` do not match the OAuth app where test users were added.

## Demo account tips

- Use a real inbox with a few scheduling threads in **Schedule** lane for the `M` hero flow.
- Send yourself a test email 30s before recording to show webhook → lane update live.
- Keep at least one AI provider key (`OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`) funded for agent chat.

### Pre-indexed demo account (recommended for video)

For hackathon recording and judge demos, use a **dedicated Google account** that is fully indexed before going live:

1. Sign in to Command Inbox with the demo account and connect Google.
2. Wait until the activity bar shows indexing complete (no “Indexing N more threads…” banner).
3. Confirm semantic search (`/`) returns results across a large thread count.
4. Use this same account in the demo video — do not connect a fresh empty inbox on camera.

Fresh connects still work: the **last 50 threads** get lanes immediately, then older mail indexes in the background with a progress banner.

### Calendar webhook security

Calendar push notifications require a stored channel token and an **HTTPS** `APP_URL`.

**Local dev:** Google rejects `http://localhost`. Use ngrok:

```bash
ngrok http 3000
# Set APP_URL=https://YOUR-SUBDOMAIN.ngrok-free.app in .env.local
bun scripts/renew-watches.ts
```

**Production:** set `APP_URL` to your Vercel domain, then reload `/inbox` once or run `bun scripts/renew-watches.ts`.

Until renewal succeeds on HTTPS, calendar webhooks return `503 Calendar watch not configured`.
