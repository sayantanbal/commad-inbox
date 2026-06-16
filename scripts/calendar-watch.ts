import { config } from "dotenv";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });
config({ path: ".env" });

const TENANT_ID = process.env.CALENDAR_WATCH_TENANT_ID ?? process.argv[2];

async function main() {
  if (!TENANT_ID) {
    console.error("Usage: bun scripts/calendar-watch.ts <tenantId>");
    process.exit(1);
  }

  const { corsair, getAppUrlFromEnv } = await import("./lib/corsair-for-scripts");
  const { registerCalendarWatch } = await import("../src/lib/webhooks/watch-register");
  const {
    buildCalendarWebhookUrl,
    calendarWatchSkipReason,
    canRegisterCalendarWatch,
  } = await import("../src/lib/webhooks/calendar-watch-url");
  const postgres = (await import("postgres")).default;

  const appUrl = getAppUrlFromEnv();
  if (!canRegisterCalendarWatch(appUrl)) {
    console.error(calendarWatchSkipReason(appUrl));
    process.exit(1);
  }

  const webhookUrl = buildCalendarWebhookUrl(appUrl, TENANT_ID);
  const channelId = randomUUID();
  const channelToken = randomUUID();

  const tenant = corsair.withTenant(TENANT_ID);
  await tenant.googlecalendar.api.events.getMany({ maxResults: 1 });
  const token = await tenant.googlecalendar.keys.get_access_token();
  if (!token) throw new Error("Calendar access token unavailable");
  const { expiration, raw } = await registerCalendarWatch(
    token,
    webhookUrl,
    channelId,
    channelToken
  );

  if (expiration || channelToken) {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    await sql`
      UPDATE users
      SET
        calendar_watch_expires_at = COALESCE(${expiration}, calendar_watch_expires_at),
        calendar_watch_channel_id = ${channelId},
        calendar_watch_channel_token = ${channelToken},
        updated_at = NOW()
      WHERE id = ${TENANT_ID}
    `;
    await sql.end();
  }

  console.log("Calendar watch registered", {
    expiration: expiration?.toISOString(),
    webhookUrl,
    raw,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
