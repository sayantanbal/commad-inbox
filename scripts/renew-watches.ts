import { config } from "dotenv";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });
config({ path: ".env" });

const TENANT_ID = process.argv[2];
const FORCE = process.argv.includes("--force");

async function main() {
  const { corsair, getAppUrlFromEnv } = await import("./lib/corsair-for-scripts");
  const { registerCalendarWatch, registerGmailWatch } = await import(
    "../src/lib/webhooks/watch-register"
  );
  const {
    buildCalendarWebhookUrl,
    calendarWatchSkipReason,
    canRegisterCalendarWatch,
  } = await import("../src/lib/webhooks/calendar-watch-url");
  const postgres = (await import("postgres")).default;

  const topic = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topic) throw new Error("GMAIL_PUBSUB_TOPIC is required");

  const appUrl = getAppUrlFromEnv();
  const calendarWatchAllowed = canRegisterCalendarWatch(appUrl);
  if (!calendarWatchAllowed) {
    console.warn(calendarWatchSkipReason(appUrl));
  }

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const tenantIds = TENANT_ID
    ? [TENANT_ID]
    : (await sql<{ id: string }[]>`SELECT id FROM users`).map((row) => row.id);

  for (const tenantId of tenantIds) {
    try {
      const tenant = corsair.withTenant(tenantId);

      await tenant.gmail.api.threads.list({ maxResults: 1 });
      const gmailToken = await tenant.gmail.keys.get_access_token();
      if (!gmailToken) throw new Error("Gmail access token unavailable");
      const gmail = await registerGmailWatch(gmailToken, topic);

      let calendar: { expiration: Date | null } = { expiration: null };
      let channelId: string | null = null;
      let channelToken: string | null = null;

      if (calendarWatchAllowed) {
        const webhookUrl = buildCalendarWebhookUrl(appUrl, tenantId);
        channelId = randomUUID();
        channelToken = randomUUID();

        await tenant.googlecalendar.api.events.getMany({ maxResults: 1 });
        const calendarToken = await tenant.googlecalendar.keys.get_access_token();
        if (!calendarToken) throw new Error("Calendar access token unavailable");
        calendar = await registerCalendarWatch(
          calendarToken,
          webhookUrl,
          channelId,
          channelToken
        );
      }

      if (gmail.expiration || calendar.expiration || channelToken) {
        await sql`
          UPDATE users
          SET
            gmail_watch_expires_at = COALESCE(${gmail.expiration}, gmail_watch_expires_at),
            calendar_watch_expires_at = COALESCE(${calendar.expiration}, calendar_watch_expires_at),
            calendar_watch_channel_id = COALESCE(${channelId}, calendar_watch_channel_id),
            calendar_watch_channel_token = COALESCE(${channelToken}, calendar_watch_channel_token),
            updated_at = NOW()
          WHERE id = ${tenantId}
        `;
      }

      console.log(`✓ ${tenantId}`, {
        gmail: gmail.expiration?.toISOString() ?? "unchanged",
        calendar: calendarWatchAllowed
          ? calendar.expiration?.toISOString() ?? "unchanged"
          : "skipped (HTTPS required)",
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
