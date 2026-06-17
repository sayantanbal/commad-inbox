# Corsair features used — judge evidence

**Project:** Command Inbox  
**Updated:** 2026-06-17  
**Purpose:** param-1 rubric — feature → code → demo beat

| Feature | Evidence (file) | Demo moment |
|---------|-----------------|-------------|
| `createCorsair` multi-tenant instance | `src/lib/corsair.ts` | OAuth connect on onboarding |
| `withTenant(userId)` per request | `src/lib/corsair/tenant.ts`, `src/lib/api/require-session.ts` | Every API route after sign-in |
| Gmail plugin (`tenant.gmail.api.*`) | `src/lib/corsair/actions.ts`, `src/lib/corsair/threads.ts` | Send, archive, thread load |
| Calendar plugin (`tenant.googlecalendar.api.*`) | `src/lib/corsair/events.ts`, `src/lib/corsair/actions.ts` | `M` key → Meet invite |
| OAuth chained Gmail → Calendar | `src/lib/corsair/oauth.ts` | Onboarding connect flow |
| `processWebhook` Gmail push | `src/app/api/webhooks/route.ts` | Live lane update (~30s) |
| Calendar push + channel verify | `src/app/api/webhooks/calendar/route.ts`, `src/lib/webhooks/verify-calendar-channel.ts` | Calendar tab refresh |
| Watch renewal cron | `scripts/renew-watches.ts`, `vercel.json` | Ops (mention in stack close) |
| `@corsair-dev/mcp` in-process | `src/lib/agent/mcp-tools.ts` | Agent `list_operations` on camera |
| Typed agent tools (not `run_script`) | `src/lib/agent/action-tools.ts` | Approval cards for send/invite |
| `google-proxy` token gateway | `src/lib/corsair/google-proxy.ts` | Attachments, watches, freeBusy |
| Corsair Postgres (`corsair_entities`) | `sql/002_corsair_tables.sql` | Architecture diagram |
| `bun run corsair:setup` / `smoke:corsair` | `scripts/corsair-setup.ts`, `scripts/smoke-corsair.ts` | README quick start |
| Standalone stdio MCP | `mcp-server.ts`, `docs/mcp-server.md` | Cursor integration |

## Claim accuracy

| Do claim | Do not claim |
|----------|--------------|
| All Google access via Corsair tenant APIs or Corsair-token gateway | "Reads never hit Google" |
| Gmail search via `tenant.gmail.api.threads.list({ q })` | "Corsair Search API" as separate product |
| Typed approval tools + discovery (`list_operations`, `get_schema`) | "Full MCP write surface via run_script" in app agent |

## Related

- [corsair-integration-plan.md](./corsair-integration-plan.md)
- [HACKATHON_JUDGE_AUDIT.md](../HACKATHON_JUDGE_AUDIT.md)
