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

  console.log("\n✓ Corsair setup complete");
  console.log(
    "Next: connect a tenant via OAuth (Phase 1) — then run `bun run smoke:corsair`"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
