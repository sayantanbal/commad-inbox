import { config } from "dotenv";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });
config({ path: ".env" });

const TENANT_ID = process.argv[2];

async function main() {
  const { corsair, getAppUrlFromEnv } = await import("./lib/corsair-for-scripts");
  const { registerCalendarWatch, registerGmailWatch } = await import(
    "../src/lib/webhooks/watch-register"
  );
  const postgres = (await import("postgres")).default;

  const topic = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topic) throw new Error("GMAIL_PUBSUB_TOPIC is required");

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const tenantIds = TENANT_ID
    ? [TENANT_ID]
    : (await sql<{ id: string }[]>`SELECT id FROM users`).map((row) => row.id);

  for (const tenantId of tenantIds) {
    try {
      const tenant = corsair.withTenant(tenantId);
      const appUrl = getAppUrlFromEnv();
      const webhookUrl = `${appUrl}/api/webhooks/calendar?tenantId=${encodeURIComponent(tenantId)}`;

      await tenant.gmail.api.threads.list({ maxResults: 1 });
      const gmailToken = await tenant.gmail.keys.get_access_token();
      const gmail = await registerGmailWatch(gmailToken, topic);

      await tenant.googlecalendar.api.events.getMany({ maxResults: 1 });
      const calendarToken = await tenant.googlecalendar.keys.get_access_token();
      const calendar = await registerCalendarWatch(calendarToken, webhookUrl, randomUUID());

      if (gmail.expiration || calendar.expiration) {
        await sql`
          UPDATE users
          SET
            gmail_watch_expires_at = COALESCE(${gmail.expiration}, gmail_watch_expires_at),
            calendar_watch_expires_at = COALESCE(${calendar.expiration}, calendar_watch_expires_at),
            updated_at = NOW()
          WHERE id = ${tenantId}
        `;
      }

      console.log(`✓ ${tenantId}`, {
        gmail: gmail.expiration?.toISOString(),
        calendar: calendar.expiration?.toISOString(),
      });
    } catch (error) {
      console.error(`✗ ${tenantId}`, error instanceof Error ? error.message : error);
    }
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
