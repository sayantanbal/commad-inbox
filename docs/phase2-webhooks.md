# Phase 2 — Gmail webhooks & local dev

Phase 2 delivers realtime triage via Gmail Pub/Sub push → Corsair → `/api/webhooks` → Gemini classify/embed → Pusher UI updates.

## Prerequisites

1. **Gmail API** enabled in your Google Cloud project (same project as OAuth).
2. **`GOOGLE_GENERATIVE_AI_API_KEY`** — Gemini for classification + embeddings.
3. **Pusher Channels** (optional but recommended — not Beams). Create a **Channels** app at [dashboard.pusher.com](https://dashboard.pusher.com). Beams is for mobile/browser push notifications; this app needs **pub/sub Channels** for live inbox UI updates. Set server vars and matching `NEXT_PUBLIC_PUSHER_*` for the browser. Without Pusher, the inbox falls back to 5s polling.
4. Run migrations: `bun run db:migrate`

## 1. Pub/Sub topic (GCP)

For this project (`command-inbox`, number `975292954031`):

```bash
gcloud config set project command-inbox
gcloud services enable pubsub.googleapis.com
gcloud pubsub topics create gmail-inbox
gcloud pubsub topics add-iam-policy-binding gmail-inbox \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

Topic full name:

```env
GMAIL_PUBSUB_TOPIC=projects/command-inbox/topics/gmail-inbox
```

Run `bun run corsair:setup` to persist the topic on the Gmail integration (`corsair.keys.gmail.set_topic_id`).

## 2. Webhook URL

Corsair delivers verified Gmail events to:

```
{APP_URL}/api/webhooks?tenantId={userId}
```

- **Production:** `APP_URL` is your deployed origin.
- **Local:** use [ngrok](https://ngrok.com/) (or similar) and set `APP_URL` to the ngrok HTTPS URL while developing.

Example:

```bash
ngrok http 3000
# APP_URL=https://abc123.ngrok-free.app
```

Your **tenant ID** is your Better Auth user id (same as Corsair tenant id). Find it in the `users` table after sign-in.

## 3. Pub/Sub push subscription

Create a push subscription on the topic pointing at your webhook:

```bash
gcloud pubsub subscriptions create gmail-inbox-push \
  --project=command-inbox \
  --topic=gmail-inbox \
  --push-endpoint="https://YOUR_HOST/api/webhooks?tenantId=TpCPHi2FMGtNiY0p0tBdIlTsuBvLzvYW"
```

Replace `YOUR_HOST` with your ngrok HTTPS host (local) or production domain.

## 4. Gmail `users.watch`

After OAuth connect, register the mailbox for push notifications (repeat if watch expires — Gmail watches last ~7 days):

```bash
# Use your access token from Corsair / OAuth tooling, or call via API explorer.
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"topicName\":\"projects/YOUR_PROJECT/topics/gmail-inbox\",\"labelIds\":[\"INBOX\"]}"
```

## 5. Verify end-to-end

1. Sign in and complete **Connect Google** (Gmail + Calendar).
2. Open `/inbox` — backfill classifies the latest 50 INBOX threads (activity bar progress).
3. Send yourself a test email — webhook should re-classify and Pusher should update the UI.
4. Press `/` for semantic search (requires backfill complete + embeddings).

Check `webhook_logs` in Postgres for delivery/debugging.

## Environment reference

See `.env.example` for Phase 2 variables:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini classify + embed |
| `GMAIL_PUBSUB_TOPIC` | Gmail push topic name |
| `PUSHER_*` / `NEXT_PUBLIC_PUSHER_*` | Realtime inbox updates |
| `APP_URL` | Webhook + OAuth base URL (ngrok in dev) |
