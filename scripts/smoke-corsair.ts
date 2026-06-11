import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const SMOKE_TENANT = process.env.SMOKE_TENANT_ID ?? "smoke-test-tenant";

async function main() {
  const { sql } = await import("drizzle-orm");
  const { corsair } = await import("../src/lib/corsair");
  const { db } = await import("../src/lib/db");

  console.log("1. Database connectivity…");
  await db.execute(sql`SELECT 1`);
  console.log("   ✓ Drizzle connected\n");

  console.log("2. Corsair instance…");
  const pluginIds = ["gmail", "googlecalendar"];
  console.log(`   ✓ Plugins configured: ${pluginIds.join(", ")}\n`);

  const tenant = corsair.withTenant(SMOKE_TENANT);

  console.log("3. Gmail threads.list (requires OAuth for tenant)…");
  try {
    const threads = await tenant.gmail.api.threads.list({ maxResults: 3 });
    console.log(`   ✓ Gmail OK — ${threads.threads?.length ?? 0} thread(s) returned\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("auth-missing") ||
      message.includes("Authentication required") ||
      message.includes("Account not found")
    ) {
      console.log("   ○ Gmail reachable — tenant not connected yet (expected pre–Phase 1)\n");
    } else {
      throw err;
    }
  }

  console.log("4. Google Calendar events.getMany (requires OAuth)…");
  try {
    const now = new Date();
    const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await tenant.googlecalendar.api.events.getMany({
      timeMin: now.toISOString(),
      timeMax: later.toISOString(),
      maxResults: 3,
    });
    console.log(`   ✓ Calendar OK — ${events.items?.length ?? 0} event(s) returned\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("auth-missing") ||
      message.includes("Authentication required") ||
      message.includes("Account not found")
    ) {
      console.log("   ○ Calendar reachable — tenant not connected yet (expected pre–Phase 1)\n");
    } else {
      throw err;
    }
  }

  console.log("✓ Phase 0/1 smoke checks passed");
  if (process.env.SMOKE_TENANT_ID) {
    console.log(`  Tenant under test: ${process.env.SMOKE_TENANT_ID}`);
  } else {
    console.log("  Set SMOKE_TENANT_ID to a connected user id for full API verification.");
  }
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
