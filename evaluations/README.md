# Agent evaluation set

Read-only Q&A pairs for measuring whether an LLM can use Command Inbox agent tools correctly.

## Files

| File | Purpose |
|------|---------|
| `inbox-agent.xml` | 10 `qa_pair` entries (calendar, search, policy) |
| `fixtures/calendar-events.json` | Stable calendar answers for `list_calendar_events` |
| `fixtures/search-threads.json` | Thread/lane fixtures for `search_threads` |
| `fixtures/agent-tools.json` | Tool allowlist + OD-5 policy answers |

## Validate locally

```bash
bun run validate:agent-eval
```

## Playwright approval harness

```bash
E2E_TEST=1 bun run test:e2e
```

Tests `/test/agent-approval` — approve `send_email`, reject `create_calendar_invite` — without Google OAuth.

## Policy

Per **OD-5**, `run_script` is **not** available in the production agent. Eval pair `policy-02` encodes this expectation.
