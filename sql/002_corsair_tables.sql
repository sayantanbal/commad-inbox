-- Corsair SDK cache / credential tables (shared with app DB)
CREATE TABLE IF NOT EXISTS corsair_integrations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  dek TEXT NULL
);

CREATE TABLE IF NOT EXISTS corsair_accounts (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id TEXT NOT NULL,
  integration_id TEXT NOT NULL REFERENCES corsair_integrations(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  dek TEXT NULL
);

CREATE INDEX IF NOT EXISTS corsair_accounts_tenant_idx ON corsair_accounts (tenant_id);

CREATE TABLE IF NOT EXISTS corsair_entities (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_id TEXT NOT NULL REFERENCES corsair_accounts(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  version TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS corsair_entities_account_idx ON corsair_entities (account_id);
CREATE INDEX IF NOT EXISTS corsair_entities_lookup_idx ON corsair_entities (account_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS corsair_events (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_id TEXT NOT NULL REFERENCES corsair_accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NULL
);

CREATE TABLE IF NOT EXISTS corsair_permissions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token TEXT NOT NULL,
  plugin TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  args TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  error TEXT NULL
);

CREATE INDEX IF NOT EXISTS corsair_permissions_token_idx ON corsair_permissions (token);
