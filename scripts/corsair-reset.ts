import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log("Clearing Corsair integration + cache rows…");
    await sql`
      TRUNCATE corsair_permissions, corsair_events, corsair_entities, corsair_accounts, corsair_integrations
    `;
    console.log("✓ Cleared\n");
  } finally {
    await sql.end();
  }

  const { execSync } = await import("node:child_process");
  execSync("bun run corsair:setup", { stdio: "inherit", env: process.env });
  console.log("\n✓ Corsair reset complete — retry Connect Google");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
