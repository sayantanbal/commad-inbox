import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

const REQUIRED_PLUGINS = ["gmail", "googlecalendar"] as const;

export type CorsairPluginId = (typeof REQUIRED_PLUGINS)[number];

export async function getConnectedPlugins(tenantId: string): Promise<Set<string>> {
  const result = await db.execute<{ name: string }>(sql`
    SELECT ci.name
    FROM corsair_accounts ca
    INNER JOIN corsair_integrations ci ON ci.id = ca.integration_id
    WHERE ca.tenant_id = ${tenantId}
  `);

  return new Set(result.rows.map((row) => row.name));
}

export async function isPluginConnected(
  tenantId: string,
  pluginId: CorsairPluginId
): Promise<boolean> {
  const connected = await getConnectedPlugins(tenantId);
  return connected.has(pluginId);
}

export async function isTenantFullyConnected(tenantId: string): Promise<boolean> {
  const connected = await getConnectedPlugins(tenantId);
  return REQUIRED_PLUGINS.every((plugin) => connected.has(plugin));
}
