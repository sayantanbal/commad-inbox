# Google OAuth — judge access

Command Inbox supports two judge sign-in paths:

| Mode | Who can sign in | Setup |
|------|-----------------|-------|
| **Production (recommended)** | Any Google account | GCP → OAuth consent screen → **Publish app** — see [Production publish](#production-publish--verification) |
| **Testing** | Only emails on **Test users** list | Add each judge Gmail in GCP — see [Request access](#request-access-judges) |

We do **not** publish shared demo passwords. Every user signs in with their own Google account.

## Request access (judges)

We do **not** publish shared demo passwords. To evaluate with your own Gmail:

1. Open a [GitHub issue](https://github.com/sayantanbal/commad-inbox/issues/new?labels=judge-access&title=Judge%20OAuth%20access%20request) with your **Gmail address** (the account you will sign in with).
2. Wait for confirmation your email was added to OAuth **Test users**.
3. Follow the [Evaluator guide](https://docs.command-inbox.sayantanbal.in/docs/overview/evaluator-guide).

Until your email is on the list, Google shows **Access blocked** — expected.

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

## Production publish & verification

**For hackathon submit today:** you do **not** need full Google verification to unblock judges — but you need to understand the tradeoffs.

### What “Publish App” does (instant)

In GCP → **OAuth consent screen** → **Publish App** moves Testing → Production in **minutes**. That alone does **not** remove the “unverified app” warning for Gmail/Calendar scopes.

### What verification requires (separate step)

After publishing, click **Prepare for verification** / **Submit for verification**. Google typically asks for:

| Item | You have it? |
|------|----------------|
| Privacy policy URL | ✅ `https://command-inbox.sayantanbal.in/privacy` |
| Homepage / app URL | ✅ `https://command-inbox.sayantanbal.in` |
| Authorized domains | Confirm `sayantanbal.in` in GCP |
| Scope justification | Explain Gmail read/send + Calendar read/write for triage, `M` invites, agent |
| Demo video (product) | ✅ https://youtu.be/zDPY7aWe970 |
| OAuth data-access demo (submitted to GCP) | ✅ https://youtu.be/ctJsPyg0UBA |
| OAuth flow in video | Consent screen → connect → feature using each scope (see data-access video) |

Official flow: [Submitting your app for verification](https://support.google.com/cloud/answer/13461325) · [Production readiness overview](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview)

### How long verification takes

| Scope tier | Typical timeline | Notes |
|------------|------------------|-------|
| Publish only (unverified) | **Minutes** | Any Google user can try; **unverified** warning remains |
| Sensitive (Calendar, `gmail.send`, etc.) | **2–4 weeks** | After complete submission |
| Restricted (full Gmail read — likely your app) | **4–12+ weeks** | May require **CASA Tier 2** security assessment (~$500–1k) |

**Reality for submit today:** Start verification **now** (use today’s demo video), but **do not wait** for approval to submit the hackathon. Judges can still sign in while unverified — they click through the warning (“Advanced” → continue).

### Hackathon-safe paths (pick one)

| Path | When to use | Judge experience |
|------|-------------|------------------|
| **A. Publish unverified** (your plan) | Submit today; judges unknown | Warning screen, then works |
| **B. Testing + test users** | Organizers give you judge emails | No publish needed; add up to **100** emails |
| **C. Verified** | Weeks from now | Clean consent — too slow for today |

**Recommended today:** **Publish now** → submit verification with demo video → in README say *“Sign in with any Google account; you may see an unverified-app warning — click Advanced to continue.”* Optionally ask ChaiCode for judge emails as **Plan B** (add to test users if publish breaks).

**Status (2026-06-18):** App **published to Production**. Google OAuth **verification submitted** (pending approval). Judges sign in with any Gmail; unverified-app warning expected until Google approves.

### 7-day token expiry (Testing mode)

While app stays **Testing** (not published), refresh tokens expire after **7 days**. **Publishing to Production** (even unverified) avoids that — important if judges evaluate over multiple days.

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

Fresh connects still work: the **last 50 threads** get lanes immediately (quick backfill), then the inbox list loads up to **150** threads while older mail indexes in the background with a progress banner.

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
