# Corsair MCP server (Cursor / IDE)

Run Command Inbox's Corsair integration as a **stdio MCP server** for Cursor or other MCP clients.

## Entry point

```bash
bun mcp-server.ts
```

Or configure in `.cursor/mcp.json` (already present in this repo).

## Tools exposed

Same allowlist as the in-app agent discovery layer:

| Tool | Read-only | Notes |
|------|-----------|-------|
| `list_operations` | Yes | List Gmail/Calendar API paths |
| `get_schema` | Yes | Schema for a path |
| `run_script` | No | **Disabled in in-app agent**; may be available in stdio server depending on Corsair MCP version |

In-app chat uses **typed workflow tools** (`send_email`, `create_calendar_invite`, etc.) instead of `run_script`.

## Environment

Requires the same env as the app:

- `DATABASE_URL`
- `CORSAIR_KEK`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `APP_URL` or `BETTER_AUTH_URL`

Run `bun run corsair:setup` after migrate if webhooks are not yet configured.

## Example Cursor prompts

- "Use list_operations to show Gmail thread operations available for my tenant."
- "What meetings do I have tomorrow?" — prefer in-app agent with `list_calendar_events`.

## Related

- [Corsair setup in Fumadocs](https://docs.command-inbox.sayantanbal.in/docs/developer-guide/corsair-setup) (if deployed)
- `src/lib/agent/mcp-tools.ts` — in-process tool wiring
- `src/lib/agent/linear-mcp.ts` — remote Linear MCP (`https://mcp.linear.app/mcp`)
- `docs/corsair-features-used.md` — feature → file map for judges

## Linear remote MCP (in-app agent)

When the user connects Linear in **Settings → Linear** (personal API token), the agent also loads a curated subset of tools from Linear's hosted MCP server via `@ai-sdk/mcp`:

| Prefixed tool | Notes |
|---------------|-------|
| `linear_list_issues` | Read-only |
| `linear_get_issue` | Read-only |
| `linear_search_issues` | Read-only |
| `linear_list_teams` | Read-only |
| `linear_list_projects` | Read-only |
| `linear_create_issue` | Requires user approval in agent chat |

Env override: `LINEAR_MCP_URL` (default `https://mcp.linear.app/mcp`).
