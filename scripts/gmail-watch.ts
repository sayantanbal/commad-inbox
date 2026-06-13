import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const TENANT_ID = process.env.GMAIL_WATCH_TENANT_ID ?? process.argv[2];

async function main() {
  if (!TENANT_ID) {
    console.error("Usage: bun scripts/gmail-watch.ts <tenantId>");
    process.exit(1);
  }

  const topic = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topic) throw new Error("GMAIL_PUBSUB_TOPIC is required");

  const { corsair } = await import("./lib/corsair-for-scripts");
  const { registerGmailWatch } = await import("../src/lib/webhooks/watch-register");
  const postgres = (await import("postgres")).default;

  const tenant = corsair.withTenant(TENANT_ID);
  await tenant.gmail.api.threads.list({ maxResults: 1 });
  const token = await tenant.gmail.keys.get_access_token();
  const { expiration, raw } = await registerGmailWatch(token, topic);

  if (expiration) {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    await sql`
      UPDATE users
      SET gmail_watch_expires_at = ${expiration}, updated_at = NOW()
      WHERE id = ${TENANT_ID}
    `;
    await sql.end();
  }

  console.log("Gmail watch registered", { expiration: expiration?.toISOString(), raw });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
