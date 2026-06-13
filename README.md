# Command Inbox

A keyboard-first Gmail + Google Calendar command center built on [Corsair](https://corsair.dev). Triage your inbox into Reply / Schedule / FYI lanes, convert emails to meetings in one keystroke, and run multi-step agent workflows via Corsair MCP.

## Features

- **Auth & multi-tenancy** — Better Auth + Google OAuth; one Corsair tenant per user
- **AI triage** — Gemini or OpenAI classifies inbound mail into lanes with scheduling intent extraction
- **Semantic search** (`/`) — pgvector embeddings over classified threads; provider switcher with auto re-embed
- **Advanced search** (`Mod+Shift+F`) — Corsair Gmail API search across full mailbox history (sender, dates, lane, attachments)
- **Hero workflow** (`M`) — inline availability → calendar invite + confirmation draft
- **Agent chat** — Corsair MCP tools with approval UI for `run_script` actions
- **Command palette & shortcuts** — Superhuman-style keys; PWA + mobile tabs

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 15, React 19, Tailwind, shadcn/ui |
| Data | Neon Postgres, Drizzle, pgvector |
| Integrations | Corsair SDK (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, `@corsair-dev/mcp`) |
| AI | Vercel AI SDK — Gemini 2.0 Flash + GPT-4o mini (fallback on rate limits) |
| Auth | Better Auth (Google) |
| Realtime | Pusher Channels |

## Quick start

### 1. Clone & install

```bash
git clone <repo-url> commad-inbox
cd commad-inbox
bun install
```

### 2. Environment

Copy `.env.example` → `.env.local` and fill in:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon Postgres with pgvector |
| `CORSAIR_KEK` | Yes | `openssl rand -base64 32` — stable across runs |
| `GOOGLE_CLIENT_ID` / `SECRET` | Yes | Gmail + Calendar OAuth (testing mode OK) |
| `BETTER_AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | One of AI keys | Gemini |
| `OPENAI_API_KEY` | One of AI keys | Fallback + optional primary |
| `GMAIL_PUBSUB_TOPIC` | Phase 2 | `projects/…/topics/…` for webhooks |
| `PUSHER_*` | Phase 2 | Realtime push |
| `CRON_SECRET` | Phase 3+ | Bearer for `/api/cron/process-due` |

### 3. Database & Corsair

```bash
bun run db:migrate
bun run corsair:setup
bun run smoke:corsair   # optional sanity check
```

### 4. Dev server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in → connect Google.

### 5. Webhooks (local)

```bash
ngrok http 3000
```

Set `APP_URL` to the ngrok HTTPS URL. Configure Gmail Pub/Sub per `docs/phase2-webhooks.md`.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `J` / `K` | Next / previous thread |
| `E` | Archive |
| `R` | Reply |
| `M` | Schedule / reschedule meeting |
| `/` | Semantic search |
| `Mod+Shift+F` | Advanced Gmail search |
| `Mod+K` | Command palette |
| `?` | Cheat sheet |

## Corsair features used

- Gmail + Google Calendar plugins (embedded SDK, multi-tenant)
- Webhook-driven cache sync
- MCP adapter (`list_operations`, `get_schema`, `run_script`) for agent chat
- Gmail `threads.list` for advanced search

## Deploy (Vercel + Neon)

1. Create Neon project with pgvector extension
2. Import repo to Vercel; set all env vars from `.env.example`
3. Run migrations against production DB: `bun run db:migrate`
4. Set production `APP_URL` and Gmail Pub/Sub push endpoint
5. Schedule cron: POST `https://your-app.vercel.app/api/cron/process-due` every minute with `Authorization: Bearer $CRON_SECRET`

## Google OAuth testing mode

Keep the OAuth app in **Testing** and add judge emails as test users. Document test user emails in your demo README / video notes.

## Demo script (60s)

1. **Problem** — scheduling email = 10+ clicks across Gmail + Calendar  
2. **Triage** — show Reply / Schedule / FYI lanes updating live via webhook  
3. **Hero** — open thread → `M` → pick slot → invite + draft  
4. **Agent** — *"Send a calendar invite to friend@corsair.dev at 9 AM next Thursday…"* → approve scripts  
5. **Search** — `/` semantic + `Mod+Shift+F` advanced filter by sender  
6. **Stack** — Corsair, pgvector, Vercel AI SDK, keyboard UX

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Invalid environment variables` in browser | Restart dev server after `.env.local` changes; never import `@/lib/env` from client code |
| `Cannot find module './873.js'` | Delete `.next` and restart: `rm -rf .next && bun dev` |
| Gemini quota / prepayment depleted | Add `OPENAI_API_KEY`; drafts/agent auto-fallback |
| Empty semantic search after provider switch | Wait for re-embed job (activity banner) or switch provider to trigger `/api/inbox/reembed` |

## License

Private — hackathon / demo project.
