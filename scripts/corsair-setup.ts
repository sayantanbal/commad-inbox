import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { corsair } = await import("../src/lib/corsair");
  const { env } = await import("../src/lib/env");
  const { setupCorsair } = await import("corsair/setup");

  console.log("Running Corsair setup (integration credentials + plugin rows)…\n");

  const output = await setupCorsair(corsair, {
    caller: "script",
    credentials: {
      gmail: {
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_url: `${env.APP_URL ?? env.BETTER_AUTH_URL}/api/auth/callback/corsair`,
      },
      googlecalendar: {
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_url: `${env.APP_URL ?? env.BETTER_AUTH_URL}/api/auth/callback/corsair`,
      },
    },
  });

  if (output.trim()) {
    console.log(output);
  }

  if (env.GMAIL_PUBSUB_TOPIC) {
    await corsair.keys.gmail.set_topic_id(env.GMAIL_PUBSUB_TOPIC);
    console.log(`\n✓ Gmail Pub/Sub topic: ${env.GMAIL_PUBSUB_TOPIC}`);
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
