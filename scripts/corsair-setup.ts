import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { corsair, getAppUrlFromEnv } = await import("./lib/corsair-for-scripts");
  const { setupCorsair } = await import("corsair/setup");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required");
  }

  const redirectUrl = `${getAppUrlFromEnv()}/api/auth/callback/corsair`;

  console.log("Running Corsair setup (integration credentials + plugin rows)…\n");

  const output = await setupCorsair(corsair, {
    caller: "script",
    credentials: {
      gmail: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_url: redirectUrl,
      },
      googlecalendar: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_url: redirectUrl,
      },
    },
  });

  if (output.trim()) {
    console.log(output);
  }

  const pubsubTopic = process.env.GMAIL_PUBSUB_TOPIC;
  if (pubsubTopic) {
    await corsair.keys.gmail.set_topic_id(pubsubTopic);
    console.log(`\n✓ Gmail Pub/Sub topic: ${pubsubTopic}`);
  } else {
    console.log(
      "\n○ GMAIL_PUBSUB_TOPIC not set — Gmail push webhooks need a Pub/Sub topic (see docs/phase2-webhooks.md)"
    );
  }

  console.log("\n✓ Corsair setup complete");
  console.log(
    "Next: connect a tenant via OAuth (Phase 1) — then run `bun run smoke:corsair`"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
