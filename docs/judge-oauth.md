# Google OAuth — judge access (Testing mode)

Command Inbox uses a Google Cloud OAuth app in **Testing** mode. Only emails listed as **Test users** can sign in until the app is published.

## Before the demo

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**.
2. Under **Test users**, add every judge and reviewer email.
3. Confirm **Gmail API** and **Google Calendar API** are enabled for the project.
4. Confirm redirect URIs include your production URLs (see [deploy.md](./deploy.md)).

## Test users to add

Replace with actual judge emails before submission:

```
# Hackathon judges / reviewers
judge1@example.com
judge2@example.com
# Your demo account
you@gmail.com
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
