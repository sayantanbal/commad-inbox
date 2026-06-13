import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const TENANT_ID = process.env.GMAIL_WATCH_TENANT_ID ?? process.argv[2];

async function main() {
  if (!TENANT_ID) {
    console.error("Usage: bun scripts/gmail-watch.ts <tenantId>");
    console.error("  or set GMAIL_WATCH_TENANT_ID in env");
    process.exit(1);
  }

  const { corsair } = await import("../src/lib/corsair");
  const { env } = await import("../src/lib/env");

  if (!env.GMAIL_PUBSUB_TOPIC) {
    throw new Error("GMAIL_PUBSUB_TOPIC is required");
  }

  const tenant = corsair.withTenant(TENANT_ID);
  await tenant.gmail.api.threads.list({ maxResults: 1 });
  const token = await tenant.gmail.keys.get_access_token();

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName: env.GMAIL_PUBSUB_TOPIC,
      labelIds: ["INBOX"],
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail watch failed (${response.status}): ${body}`);
  }

  console.log("✓ Gmail watch registered");
  console.log(body);
  console.log("\nWatch expires in ~7 days — re-run this script to renew.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
